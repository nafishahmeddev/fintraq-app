import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { format, isSameDay, parseISO } from 'date-fns';
import { eq } from 'drizzle-orm';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfirmDialog } from '../../../components/core/ConfirmDialog';
import { Header } from '../../../components/core/Header';
import { OptionsDialog } from '../../../components/core/OptionsDialog';
import { db } from '../../../db/client';
import { RecurringEndCondition, RecurringFrequency, RecurringIntervalUnit, payments, recurringTransactions as recurringTransactionsTable } from '../../../db/schema';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { NotificationService } from '../../../services/notification.service';
import { TransactionType } from '../../../types';
import { formatCurrency, fromDbColor } from '../../../utils/format';
import { resolveIcon } from '../../../utils/icons';
import { RecurringTransactionWithRelations, useDeleteRecurring, useRecurringTransactions, useToggleRecurringPause } from '../api/recurring';
import { calculateNextOccurrenceDate, hasMetEndCondition } from '../services/syncRecurring';

type TabKey = 'ACTIVE' | 'DUE' | 'PAUSED';

const getFrequencyText = (item: RecurringTransactionWithRelations) => {
  if (item.frequency === 'CUSTOM') {
    const unit = item.intervalUnit?.toLowerCase() || 'days';
    return `Every ${item.interval} ${unit}`;
  }
  if (item.frequency === 'BI_WEEKLY') return 'Every 2 weeks';
  return item.frequency.charAt(0) + item.frequency.slice(1).toLowerCase();
};

const RecurringCard = React.memo(function RecurringCard({
  item,
  isDue,
  showActions,
  onPress,
  onLongPress,
  onProcess,
  onSkip,
}: {
  item: RecurringTransactionWithRelations;
  isDue: boolean;
  showActions: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onProcess: () => void;
  onSkip: () => void;
}) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createCardStyles(theme), [theme]);

  const isCR = item.type === 'CR';
  const stripColor = isCR ? colors.success : colors.danger;
  const itemColor = fromDbColor(item.color);
  const nextDate = parseISO(item.nextDate);
  const dateLabel = isDue ? 'Due' : 'Next';
  const dateColor = isDue ? colors.danger : colors.textMuted;

  return (
    <View style={[styles.card, item.isPaused && styles.cardPaused]}>
      <View style={[styles.accentStrip, { backgroundColor: stripColor }]} />
      <TouchableOpacity
        style={styles.cardBody}
        activeOpacity={0.8}
        onPress={onPress}
        onLongPress={onLongPress}
      >
        <View style={[styles.iconBox, { backgroundColor: itemColor + '20' }]}>
          <Ionicons name={resolveIcon(item.icon, 'sync-outline')} size={20} color={itemColor} />
        </View>
        <View style={styles.mainInfo}>
          <View style={styles.topRow}>
            <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
            <Text style={[styles.cardAmount, { color: isCR ? colors.success : colors.text }]}>
              {isCR ? '+' : '−'}{formatCurrency(item.amount, item.account?.currency || 'USD')}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.freqPill}>
              <Text style={styles.freqText}>{getFrequencyText(item)}</Text>
            </View>
            {item.category?.name && (
              <Text style={styles.categoryText} numberOfLines={1}>{item.category.name}</Text>
            )}
          </View>
          <View style={styles.footerRow}>
            <Ionicons name="time-outline" size={12} color={dateColor} />
            <Text style={[styles.dateLabel, { color: dateColor }]}>{dateLabel}: </Text>
            <Text style={[styles.dateValue, { color: dateColor }]}>
              {format(nextDate, 'MMM d, yyyy')}
            </Text>
            {item.isPaused && (
              <View style={styles.pausedBadge}>
                <Text style={styles.pausedBadgeText}>Paused</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {showActions && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.skipBtn} onPress={onSkip} activeOpacity={0.8}>
            <Text style={styles.skipBtnText}>Skip</Text>
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          <TouchableOpacity style={styles.processBtn} onPress={onProcess} activeOpacity={0.8}>
            <Ionicons name="checkmark" size={14} color={colors.primary} />
            <Text style={styles.processBtnText}>Process</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

export const RecurringScreen = React.memo(function RecurringScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();

  const { data: recurringTransactions, isLoading } = useRecurringTransactions();
  const { mutate: deleteRecurring } = useDeleteRecurring();
  const { mutate: togglePause } = useToggleRecurringPause();
  const queryClient = useQueryClient();

  const [selectedTab, setSelectedTab] = useState<TabKey>('ACTIVE');
  const [selectedTemplate, setSelectedTemplate] = useState<RecurringTransactionWithRelations | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const currentDate = useMemo(() => new Date(), []);

  const dueCount = useMemo(() => {
    if (!recurringTransactions) return 0;
    return recurringTransactions.filter(t => {
      if (t.isPaused) return false;
      const d = parseISO(t.nextDate);
      return d <= currentDate || isSameDay(d, currentDate);
    }).length;
  }, [recurringTransactions, currentDate]);

  const visibleItems = useMemo(() => {
    if (!recurringTransactions) return [];
    return recurringTransactions.filter(t => {
      const scheduledDate = parseISO(t.nextDate);
      const isDueToday = scheduledDate <= currentDate || isSameDay(scheduledDate, currentDate);
      if (selectedTab === 'PAUSED') return t.isPaused;
      if (t.isPaused) return false;
      if (selectedTab === 'DUE') return isDueToday;
      return !isDueToday;
    });
  }, [recurringTransactions, selectedTab, currentDate]);

  const handleProcess = useCallback(async (template: RecurringTransactionWithRelations) => {
    try {
      await db.insert(payments).values({
        amount: template.amount,
        type: template.type as TransactionType,
        categoryId: template.categoryId,
        accountId: template.accountId,
        note: template.note,
        datetime: template.nextDate,
        recurringId: template.id,
      });

      const nextDate = calculateNextOccurrenceDate(
        template.nextDate,
        template.frequency as RecurringFrequency,
        template.interval,
        template.intervalUnit as RecurringIntervalUnit
      );

      const updatedCount = template.occurrencesCount + 1;
      const isCompleted = hasMetEndCondition(
        template.endCondition as RecurringEndCondition,
        template.endValue,
        updatedCount,
        nextDate
      );

      await db.update(recurringTransactionsTable)
        .set({ nextDate, occurrencesCount: updatedCount, isPaused: isCompleted ? true : template.isPaused })
        .where(eq(recurringTransactionsTable.id, template.id));

      queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });

      if (!isCompleted) {
        await NotificationService.scheduleRecurringReminder(
          template.id,
          template.name,
          formatCurrency(template.amount, template.account?.currency || 'USD'),
          nextDate,
          template.reminderDays
        );
      }
    } catch {
      Alert.alert('Processing failed', 'Could not record the recurring transaction.');
    }
  }, [queryClient]);

  const handleSkip = useCallback(async (template: RecurringTransactionWithRelations) => {
    try {
      const nextDate = calculateNextOccurrenceDate(
        template.nextDate,
        template.frequency as RecurringFrequency,
        template.interval,
        template.intervalUnit as RecurringIntervalUnit
      );

      const isCompleted = hasMetEndCondition(
        template.endCondition as RecurringEndCondition,
        template.endValue,
        template.occurrencesCount,
        nextDate
      );

      await db.update(recurringTransactionsTable)
        .set({ nextDate, isPaused: isCompleted ? true : template.isPaused })
        .where(eq(recurringTransactionsTable.id, template.id));

      queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] });

      if (!isCompleted) {
        await NotificationService.scheduleRecurringReminder(
          template.id,
          template.name,
          formatCurrency(template.amount, template.account?.currency || 'USD'),
          nextDate,
          template.reminderDays
        );
      }
    } catch {
      Alert.alert('Skip failed', 'Could not skip the recurring transaction.');
    }
  }, [queryClient]);

  const menuOptions = useMemo(() => {
    if (!selectedTemplate) return [];
    return [
      {
        key: 'edit',
        label: 'Edit details',
        icon: 'create-outline' as const,
        onPress: () => { setShowOptions(false); router.push(`/recurring/edit/${selectedTemplate.id}`); },
      },
      {
        key: 'pause',
        label: selectedTemplate.isPaused ? 'Resume recurring' : 'Pause recurring',
        icon: (selectedTemplate.isPaused ? 'play-outline' : 'pause-outline') as React.ComponentProps<typeof Ionicons>['name'],
        onPress: () => {
          setShowOptions(false);
          togglePause({ id: selectedTemplate.id, isPaused: !selectedTemplate.isPaused });
        },
      },
      {
        key: 'delete',
        label: 'Delete recurring',
        icon: 'trash-outline' as const,
        destructive: true,
        onPress: () => { setShowOptions(false); setShowDeleteConfirm(true); },
      },
    ];
  }, [selectedTemplate, router, togglePause]);

  const renderItem = useCallback(({ item }: { item: RecurringTransactionWithRelations }) => {
    const nextDate = parseISO(item.nextDate);
    const isDue = !item.isPaused && (nextDate <= currentDate || isSameDay(nextDate, currentDate));
    return (
      <RecurringCard
        item={item}
        isDue={isDue}
        showActions={selectedTab === 'DUE'}
        onPress={() => router.push(`/recurring/edit/${item.id}`)}
        onLongPress={() => { setSelectedTemplate(item); setShowOptions(true); }}
        onProcess={() => handleProcess(item)}
        onSkip={() => handleSkip(item)}
      />
    );
  }, [selectedTab, currentDate, router, handleProcess, handleSkip]);

  const keyExtractor = useCallback((item: RecurringTransactionWithRelations) => item.id.toString(), []);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'ACTIVE', label: 'Upcoming' },
    { key: 'DUE', label: 'Due' },
    { key: 'PAUSED', label: 'Paused' },
  ];

  const emptyMessages: Record<TabKey, { title: string; subtitle: string }> = {
    ACTIVE: { title: 'No upcoming entries', subtitle: 'Automate your fixed income and expenses.' },
    DUE: { title: 'All caught up', subtitle: 'No transactions due right now.' },
    PAUSED: { title: 'Nothing paused', subtitle: 'Paused recurring entries will appear here.' },
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Recurring"
        showBack
        rightAction={
          <TouchableOpacity onPress={() => router.push('/recurring/create')} activeOpacity={0.75}>
            <Ionicons name="add" size={26} color={colors.text} />
          </TouchableOpacity>
        }
      />

      <View style={styles.tabBar}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
            onPress={() => setSelectedTab(tab.key)}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabText, selectedTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
            {tab.key === 'DUE' && dueCount > 0 && (
              <View style={styles.dueBadge}>
                <Text style={styles.dueBadgeText}>{dueCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={visibleItems}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="sync-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>{emptyMessages[selectedTab].title}</Text>
              <Text style={styles.emptyText}>{emptyMessages[selectedTab].subtitle}</Text>
              {selectedTab === 'ACTIVE' && (
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => router.push('/recurring/create')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyBtnText}>Create recurring</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      <OptionsDialog
        visible={showOptions}
        onClose={() => setShowOptions(false)}
        title="Recurring options"
        subtitle={selectedTemplate?.name}
        options={menuOptions}
      />

      <ConfirmDialog
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete recurring"
        message="This will stop future automatic entries. Past entries will remain."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (selectedTemplate) {
            deleteRecurring(selectedTemplate.id);
            setSelectedTemplate(null);
          }
          setShowDeleteConfirm(false);
        }}
      />
    </SafeAreaView>
  );
});

const createCardStyles = (theme: Theme) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['3xl'],
    overflow: 'hidden',
    flexDirection: 'column',
  },
  cardPaused: {
    opacity: 0.55,
  },
  accentStrip: {
    height: 4,
    width: '100%',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing[16],
    gap: theme.spacing[12],
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainInfo: {
    flex: 1,
    gap: theme.spacing[4],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing[8],
  },
  cardName: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: theme.fontSizes.md,
    color: theme.colors.text,
    flex: 1,
  },
  cardAmount: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: theme.fontSizes.md,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[8],
  },
  freqPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.overlay,
  },
  freqText: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  categoryText: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 12,
    color: theme.colors.textMuted,
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateLabel: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 11,
  },
  dateValue: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 11,
    flex: 1,
  },
  pausedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.overlay,
  },
  pausedBadgeText: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.colors.overlay,
  },
  skipBtn: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtnText: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  actionDivider: {
    width: 1,
    backgroundColor: theme.colors.overlay,
  },
  processBtn: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[4],
  },
  processBtnText: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 13,
    color: theme.colors.primary,
  },
});

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: theme.spacing[4],
    gap: theme.spacing[4],
    marginBottom: theme.spacing[4],
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[8],
    borderRadius: theme.radius.full,
    gap: theme.spacing[8],
  },
  activeTab: {
    backgroundColor: theme.colors.surface,
  },
  tabText: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  activeTabText: {
    color: theme.colors.text,
    fontFamily: theme.fontFamilies.sansBold,
  },
  dueBadge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dueBadgeText: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 10,
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: theme.spacing[8],
    paddingBottom: 40,
    gap: theme.spacing[12],
  },
  emptyContainer: {
    paddingVertical: 64,
    alignItems: 'center',
    gap: theme.spacing[8],
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: theme.fontSizes.lg,
    color: theme.colors.text,
    marginTop: theme.spacing[8],
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    maxWidth: 260,
  },
  emptyBtn: {
    marginTop: theme.spacing[8],
    height: 40,
    paddingHorizontal: theme.spacing[20],
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBtnText: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 13,
    color: theme.colors.text,
  },
});
