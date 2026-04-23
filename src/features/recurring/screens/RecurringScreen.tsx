import { Ionicons } from '@expo/vector-icons';
import { format, isSameDay, parseISO } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { eq } from 'drizzle-orm';
import { db } from '../../../db/client';
import { RecurringEndCondition, RecurringFrequency, RecurringIntervalUnit, payments, recurringTransactions as recurringTransactionsTable } from '../../../db/schema';
import { getNextRecurringDate, hasMetEndCondition } from '../services/syncRecurring';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurBackground } from '../../../components/ui/BlurBackground';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Header } from '../../../components/ui/Header';
import { OptionsDialog, OptionsDialogOption } from '../../../components/ui/OptionsDialog';
import { TransactionType } from '../../../types';
import { useTheme } from '../../../providers/ThemeProvider';
import { ThemeColors } from '../../../theme/colors';
import { COMPONENT_SIZES, LAYOUT, radius, shadow, spacing } from '../../../theme/tokens';
import { TYPOGRAPHY } from '../../../theme/typography';
import { formatCurrency } from '../../../utils/format';
import { resolveIcon } from '../../../utils/icons';
import { NotificationService } from '../../../services/notification.service';
import { RecurringTransactionWithRelations, useDeleteRecurring, useRecurringTransactions, useToggleRecurringPause } from '../api/recurring';

const toHexColor = (value: number | null) => {
  if (value === null) return '#808080';
  return `#${value.toString(16).padStart(6, '0')}`;
};

export const RecurringScreen = React.memo(function RecurringScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  
  const { data: recurringTransactions, isLoading } = useRecurringTransactions();
  const { mutate: deleteRecurring } = useDeleteRecurring();
  const { mutate: togglePause } = useToggleRecurringPause();
  
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'DUE' | 'ARCHIVED'>('ACTIVE');
  const [selectedItem, setSelectedItem] = useState<RecurringTransactionWithRelations | null>(null);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const now = React.useMemo(() => new Date(), []);

  const filteredData = React.useMemo(() => {
    if (!recurringTransactions) return [];
    
    return recurringTransactions.filter(item => {
      const nextDate = parseISO(item.nextDate);
      const isDue = nextDate <= now || isSameDay(nextDate, now);
      
      if (activeTab === 'ARCHIVED') return item.isPaused;
      if (item.isPaused) return false;
      if (activeTab === 'DUE') return isDue;
      return !isDue;
    });
  }, [recurringTransactions, activeTab]);

  const onProcessRecurring = React.useCallback(async (item: RecurringTransactionWithRelations) => {
    try {
      // 1. Insert payment record
      await db.insert(payments).values({
        amount: item.amount,
        type: item.type as TransactionType,
        categoryId: item.categoryId,
        accountId: item.accountId,
        note: item.note,
        datetime: item.nextDate,
        recurringId: item.id,
      });

      // 2. Calculate next scheduled date
      const nextScheduledDate = getNextRecurringDate(
        item.nextDate,
        item.frequency as RecurringFrequency,
        item.interval,
        item.intervalUnit as RecurringIntervalUnit
      );

      // 3. Update template state
      const updatedOccurrencesCount = item.occurrencesCount + 1;
      const isTemplateCompleted = hasMetEndCondition(
        item.endCondition as RecurringEndCondition,
        item.endValue,
        updatedOccurrencesCount,
        nextScheduledDate
      );

      await db.update(recurringTransactionsTable)
        .set({
          nextDate: nextScheduledDate,
          occurrencesCount: updatedOccurrencesCount,
          isPaused: isTemplateCompleted ? true : item.isPaused,
        })
        .where(eq(recurringTransactionsTable.id, item.id));

      queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });

      // 4. Reschedule reminders
      if (!isTemplateCompleted) {
        await NotificationService.scheduleRecurringReminder(
          item.id,
          item.name,
          formatCurrency(item.amount, item.account?.currency || 'USD'),
          nextScheduledDate,
          item.reminderDays
        );
      }
    } catch (error) {
      console.error('[onProcessRecurring] Error:', error);
      Alert.alert('Processing Failed', 'Could not record the recurring transaction.');
    }
  }, [queryClient]);

  const onSkipRecurring = React.useCallback(async (item: RecurringTransactionWithRelations) => {
    try {
      const nextScheduledDate = getNextRecurringDate(
        item.nextDate,
        item.frequency as RecurringFrequency,
        item.interval,
        item.intervalUnit as RecurringIntervalUnit
      );

      // 2. Update template state
      const isTemplateCompleted = hasMetEndCondition(
        item.endCondition as RecurringEndCondition,
        item.endValue,
        item.occurrencesCount, // Skipping doesn't increment occurrence count
        nextScheduledDate
      );

      await db.update(recurringTransactionsTable)
        .set({ 
          nextDate: nextScheduledDate,
          isPaused: isTemplateCompleted ? true : item.isPaused,
        })
        .where(eq(recurringTransactionsTable.id, item.id));

      queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] });

      // 3. Reschedule reminders
      if (!isTemplateCompleted) {
        await NotificationService.scheduleRecurringReminder(
          item.id,
          item.name,
          formatCurrency(item.amount, item.account?.currency || 'USD'),
          nextScheduledDate,
          item.reminderDays
        );
      }
    } catch (error) {
      console.error('[onSkipRecurring] Error:', error);
      Alert.alert('Skip Failed', 'Could not skip the recurring transaction.');
    }
  }, [queryClient]);

  const onNavigateToCreate = () => {
    router.push('/recurring/create');
  };

  const manageOptions: OptionsDialogOption[] = React.useMemo(() => {
    if (!selectedItem) return [];

    return [
      {
        key: 'edit-recurring',
        label: 'Edit details',
        icon: 'create-outline' as const,
        onPress: () => router.push(`/recurring/edit/${selectedItem.id}`),
      },
      {
        key: 'pause-recurring',
        label: selectedItem.isPaused ? 'Resume recurring' : 'Pause recurring',
        icon: (selectedItem.isPaused ? 'play-outline' : 'pause-outline') as React.ComponentProps<typeof Ionicons>['name'],
        onPress: () => togglePause({ id: selectedItem.id, isPaused: !selectedItem.isPaused }),
      },
      {
        key: 'delete-recurring',
        label: 'Delete recurring',
        icon: 'trash-outline' as const,
        destructive: true,
        onPress: () => setShowDeleteDialog(true),
      },
    ];
  }, [selectedItem, router, togglePause]);

  const renderItem = React.useCallback(({ item }: { item: RecurringTransactionWithRelations }) => {
    const nextDate = parseISO(item.nextDate);
    const formattedNextDate = format(nextDate, 'MMM d, yyyy');
    const isDue = nextDate <= now || isSameDay(nextDate, now);
    
    const getFrequencyText = () => {
      if (item.frequency === 'CUSTOM') {
        const unit = item.intervalUnit?.toLowerCase() || 'days';
        return `Every ${item.interval} ${unit}`;
      }
      if (item.frequency === 'BI_WEEKLY') return 'Every 2 weeks';
      return item.frequency.charAt(0) + item.frequency.slice(1).toLowerCase();
    };

    const color = toHexColor(item.color);

    return (
      <View style={[styles.card, item.isPaused && styles.cardPaused]}>
        <TouchableOpacity
          style={styles.cardMain}
          activeOpacity={0.8}
          onLongPress={() => {
            setSelectedItem(item);
            setShowManageDialog(true);
          }}
          onPress={() => router.push(`/recurring/edit/${item.id}`)}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
              <Ionicons name={resolveIcon(item.icon, 'sync-outline')} size={20} color={color} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
              <View style={styles.badgeRow}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{item.category?.name || 'Uncategorized'}</Text>
                </View>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.frequencyText}>{getFrequencyText()}</Text>
              </View>
            </View>
            <View style={styles.cardRight}>
              <Text style={[styles.cardAmount, { color: item.type === 'CR' ? colors.success : colors.text }]}>
                {item.type === 'CR' ? '+' : '-'}{formatCurrency(item.amount, item.account?.currency || 'USD')}
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.nextRunContainer}>
              <Ionicons name="time-outline" size={12} color={colors.textMuted} />
              <Text style={styles.nextRunLabel}>{isDue ? 'DUE DATE:' : 'NEXT RUN:'}</Text>
              <Text style={[styles.nextRunValue, isDue && { color: colors.danger }]}>{formattedNextDate}</Text>
            </View>
            {item.isPaused && (
              <View style={styles.pausedBadge}>
                <Ionicons name="pause" size={10} color={colors.textMuted} />
                <Text style={styles.pausedText}>PAUSED</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {activeTab === 'DUE' && (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.skipBtn]} 
              onPress={() => onSkipRecurring(item)}
            >
              <Text style={styles.skipBtnText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.processBtn]} 
              onPress={() => onProcessRecurring(item)}
            >
              <Text style={styles.processBtnText}>Process</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }, [colors, router, styles, activeTab, now, onProcessRecurring, onSkipRecurring]);

  return (
    <SafeAreaView style={styles.container}>
      <BlurBackground />
      <Header title="Recurring" subtitle="Manage automatic entries" showBack />

      <View style={styles.tabBar}>
        {(['ACTIVE', 'DUE', 'ARCHIVED'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </Text>
            {tab === 'DUE' && recurringTransactions?.some(t => {
              const d = parseISO(t.nextDate);
              return !t.isPaused && (d <= now || isSameDay(d, now));
            }) && (
              <View style={styles.dotIndicator} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="sync-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>
                {activeTab === 'DUE' ? 'No entries due' : activeTab === 'ARCHIVED' ? 'No archived entries' : 'No recurring entries'}
              </Text>
              <Text style={styles.emptyText}>
                {activeTab === 'DUE' ? 'You are all caught up!' : 'Automate your fixed income and expenses.'}
              </Text>
              {activeTab === 'ACTIVE' && (
                <TouchableOpacity style={styles.emptyBtn} onPress={onNavigateToCreate}>
                  <Text style={styles.emptyBtnText}>Create recurring</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={onNavigateToCreate}>
        <Ionicons name="add" size={28} color="#000" />
      </TouchableOpacity>

      <OptionsDialog
        visible={showManageDialog}
        onClose={() => setShowManageDialog(false)}
        title="Manage Recurring"
        subtitle={selectedItem?.name}
        options={manageOptions}
      />

      <ConfirmDialog
        visible={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Delete Recurring"
        message="This will stop future automatic entries. Past entries will remain."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (selectedItem) {
            deleteRecurring(selectedItem.id);
            setSelectedItem(null);
          }
        }}
      />
    </SafeAreaView>
  );
});

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingTop: spacing('4'),
    paddingBottom: 120,
    gap: LAYOUT.cardGap,
  },
  card: {
    borderRadius: radius('2xl'),
    backgroundColor: colors.surface,
    padding: spacing('4'),
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow('sm'),
  },
  cardPaused: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('3'),
    marginBottom: spacing('4'),
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius('md'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing('1'),
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('2'),
  },
  categoryBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing('2'),
    paddingVertical: spacing('0.5'),
    borderRadius: radius('xs'),
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryBadgeText: {
    fontFamily: TYPOGRAPHY.fonts.bold,
    fontSize: 9,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  dot: {
    color: colors.textMuted,
    fontSize: 10,
  },
  frequencyText: {
    fontFamily: TYPOGRAPHY.fonts.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  cardAmount: {
    fontFamily: TYPOGRAPHY.fonts.monoBold,
    fontSize: 18,
    letterSpacing: -0.5,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing('3'),
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderStyle: 'dashed',
  },
  nextRunContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('1.5'),
  },
  nextRunLabel: {
    fontFamily: TYPOGRAPHY.fonts.bold,
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  nextRunValue: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 12,
    color: colors.text,
  },
  pausedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.textMuted + '20',
    paddingHorizontal: spacing('2'),
    paddingVertical: spacing('1'),
    borderRadius: radius('xs'),
  },
  pausedText: {
    fontFamily: TYPOGRAPHY.fonts.bold,
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  fab: {
    position: 'absolute',
    bottom: 34,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: radius('full'),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow('lg'),
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: TYPOGRAPHY.fonts.heading,
    color: colors.text,
    fontSize: 24,
    marginTop: spacing('4'),
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: colors.textMuted,
    fontSize: 15,
    marginTop: spacing('2'),
    marginBottom: spacing('7'),
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyBtn: {
    height: COMPONENT_SIZES.button.md.height,
    borderRadius: radius('full'),
    paddingHorizontal: spacing('6'),
    backgroundColor: colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBtnText: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 15,
    color: colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: LAYOUT.screenPadding,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing('4'),
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.text,
  },
  tabText: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 13,
    color: colors.textMuted,
  },
  activeTabText: {
    color: colors.text,
  },
  dotIndicator: {
    position: 'absolute',
    top: spacing('3'),
    right: '25%',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.danger,
  },
  cardMain: {
    padding: spacing('4'),
  },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtn: {
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  skipBtnText: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 14,
    color: colors.textMuted,
  },
  processBtn: {
    backgroundColor: colors.primary + '10',
  },
  processBtnText: {
    fontFamily: TYPOGRAPHY.fonts.bold,
    fontSize: 14,
    color: colors.primary,
  },
});
