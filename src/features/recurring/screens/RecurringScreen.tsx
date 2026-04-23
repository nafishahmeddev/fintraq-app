import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { format, isSameDay, parseISO } from 'date-fns';
import { eq } from 'drizzle-orm';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList,  Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Badge,
  BlurBackground,
  Card,
  ConfirmDialog,
  HStack,
  Header,
  IconBox,
  OptionsDialog,
  OptionsDialogOption,
  Typography,
  VStack
} from '../../../components/ui';
import { db } from '../../../db/client';
import { RecurringEndCondition, RecurringFrequency, RecurringIntervalUnit, payments, recurringTransactions as recurringTransactionsTable } from '../../../db/schema';
import { useTheme } from '../../../providers/ThemeProvider';
import { NotificationService } from '../../../services/notification.service';
import { TransactionType } from '../../../types';
import { formatCurrency } from '../../../utils/format';
import { resolveIcon } from '../../../utils/icons';
import { RecurringTransactionWithRelations, useDeleteRecurring, useRecurringTransactions, useToggleRecurringPause } from '../api/recurring';
import { calculateNextOccurrenceDate, hasMetEndCondition } from '../services/syncRecurring';

const toHexColor = (value: number | null) => {
  if (value === null) return '#808080';
  return `#${value.toString(16).padStart(6, '0')}`;
};

export const RecurringScreen = React.memo(function RecurringScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const { data: recurringTransactions, isLoading } = useRecurringTransactions();
  const { mutate: deleteRecurring } = useDeleteRecurring();
  const { mutate: togglePause } = useToggleRecurringPause();

  const queryClient = useQueryClient();

  const [selectedTab, setSelectedTab] = useState<'ACTIVE' | 'DUE' | 'ARCHIVED'>('ACTIVE');
  const [selectedTemplate, setSelectedTemplate] = useState<RecurringTransactionWithRelations | null>(null);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const currentDate = React.useMemo(() => new Date(), []);

  const visibleRecurringTransactions = React.useMemo(() => {
    if (!recurringTransactions) return [];

    return recurringTransactions.filter(template => {
      const scheduledDate = parseISO(template.nextDate);
      const isDueToday = scheduledDate <= currentDate || isSameDay(scheduledDate, currentDate);

      if (selectedTab === 'ARCHIVED') return template.isPaused;
      if (template.isPaused) return false;
      if (selectedTab === 'DUE') return isDueToday;
      return !isDueToday;
    });
  }, [recurringTransactions, selectedTab, currentDate]);

  const handleProcessTransaction = React.useCallback(async (template: RecurringTransactionWithRelations) => {
    try {
      // 1. Insert payment record
      await db.insert(payments).values({
        amount: template.amount,
        type: template.type as TransactionType,
        categoryId: template.categoryId,
        accountId: template.accountId,
        note: template.note,
        datetime: template.nextDate,
        recurringId: template.id,
      });

      // 2. Calculate next scheduled date
      const nextDate = calculateNextOccurrenceDate(
        template.nextDate,
        template.frequency as RecurringFrequency,
        template.interval,
        template.intervalUnit as RecurringIntervalUnit
      );

      // 3. Update template state
      const updatedOccurrencesCount = template.occurrencesCount + 1;
      const isTemplateCompleted = hasMetEndCondition(
        template.endCondition as RecurringEndCondition,
        template.endValue,
        updatedOccurrencesCount,
        nextDate
      );

      await db.update(recurringTransactionsTable)
        .set({
          nextDate: nextDate,
          occurrencesCount: updatedOccurrencesCount,
          isPaused: isTemplateCompleted ? true : template.isPaused,
        })
        .where(eq(recurringTransactionsTable.id, template.id));

      queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });

      // 4. Reschedule reminders
      if (!isTemplateCompleted) {
        await NotificationService.scheduleRecurringReminder(
          template.id,
          template.name,
          formatCurrency(template.amount, template.account?.currency || 'USD'),
          nextDate,
          template.reminderDays
        );
      }
    } catch (error) {
      console.error('[handleProcessTransaction] Error:', error);
      Alert.alert('Processing Failed', 'Could not record the recurring transaction.');
    }
  }, [queryClient]);

  const handleSkipOccurrence = React.useCallback(async (template: RecurringTransactionWithRelations) => {
    try {
      const nextDate = calculateNextOccurrenceDate(
        template.nextDate,
        template.frequency as RecurringFrequency,
        template.interval,
        template.intervalUnit as RecurringIntervalUnit
      );

      // 2. Update template state
      const isTemplateCompleted = hasMetEndCondition(
        template.endCondition as RecurringEndCondition,
        template.endValue,
        template.occurrencesCount, // Skipping doesn't increment occurrence count
        nextDate
      );

      await db.update(recurringTransactionsTable)
        .set({
          nextDate: nextDate,
          isPaused: isTemplateCompleted ? true : template.isPaused,
        })
        .where(eq(recurringTransactionsTable.id, template.id));

      queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] });

      // 3. Reschedule reminders
      if (!isTemplateCompleted) {
        await NotificationService.scheduleRecurringReminder(
          template.id,
          template.name,
          formatCurrency(template.amount, template.account?.currency || 'USD'),
          nextDate,
          template.reminderDays
        );
      }
    } catch (error) {
      console.error('[handleSkipOccurrence] Error:', error);
      Alert.alert('Skip Failed', 'Could not skip the recurring transaction.');
    }
  }, [queryClient]);

  const onNavigateToCreate = () => {
    router.push('/recurring/create');
  };

  const manageOptions: OptionsDialogOption[] = React.useMemo(() => {
    if (!selectedTemplate) return [];

    return [
      {
        key: 'edit-recurring',
        label: 'Edit details',
        icon: 'create-outline' as const,
        onPress: () => router.push(`/recurring/edit/${selectedTemplate.id}`),
      },
      {
        key: 'pause-recurring',
        label: selectedTemplate.isPaused ? 'Resume recurring' : 'Pause recurring',
        icon: (selectedTemplate.isPaused ? 'play-outline' : 'pause-outline') as React.ComponentProps<typeof Ionicons>['name'],
        onPress: () => togglePause({ id: selectedTemplate.id, isPaused: !selectedTemplate.isPaused }),
      },
      {
        key: 'delete-recurring',
        label: 'Delete recurring',
        icon: 'trash-outline' as const,
        destructive: true,
        onPress: () => setIsDeleteDialogOpen(true),
      },
    ];
  }, [selectedTemplate, router, togglePause]);

  const renderItem = React.useCallback(({ item }: { item: RecurringTransactionWithRelations }) => {
    const nextDate = parseISO(item.nextDate);
    const formattedNextDate = format(nextDate, 'MMM d, yyyy');
    const isDue = nextDate <= currentDate || isSameDay(nextDate, currentDate);

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
      <Card
        style={item.isPaused ? styles.cardPaused : undefined}
        variant="filled"
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onLongPress={() => {
            setSelectedTemplate(item);
            setIsManageDialogOpen(true);
          }}
          onPress={() => router.push(`/recurring/edit/${item.id}`)}
        >
          <VStack gap="3">
            <HStack gap="3" align="center">
              <IconBox
                icon={resolveIcon(item.icon, 'sync-outline')}
                iconColor={color}
                backgroundColor={color + '20'}
                size="md"
              />
              <VStack flex={1} gap="1">
                <Typography variant="body" weight="semibold" numberOfLines={1}>
                  {item.name}
                </Typography>
                <HStack gap="2" align="center">
                  <Badge
                    label={item.category?.name || 'Uncategorized'}
                    variant="default"
                  />
                  <Typography variant="label">•</Typography>
                  <Typography variant="bodySm" color={colors.textMuted}>
                    {getFrequencyText()}
                  </Typography>
                </HStack>
              </VStack>
              <Typography
                variant="mono"
                weight="bold"
                color={item.type === 'CR' ? colors.success : colors.text}
              >
                {item.type === 'CR' ? '+' : '-'}{formatCurrency(item.amount, item.account?.currency || 'USD')}
              </Typography>
            </HStack>

            <HStack justify="space-between" align="center" pt="2" style={styles.cardFooter}>
              <HStack gap="1.5">
                <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                <Typography variant="label">
                  {isDue ? 'DUE DATE:' : 'NEXT RUN:'}
                </Typography>
                <Typography
                  variant="monoSm"
                  color={isDue ? colors.danger : colors.textMuted}
                >
                  {formattedNextDate}
                </Typography>
              </HStack>

              {item.isPaused && (
                <Badge
                  label="PAUSED"
                  variant="default"
                  style={{ borderStyle: 'dashed' }}
                />
              )}
            </HStack>
          </VStack>
        </TouchableOpacity>

        {selectedTab === 'DUE' && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.skipBtn]}
              onPress={() => handleSkipOccurrence(item)}
            >
              <Text style={styles.skipBtnText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.processBtn]}
              onPress={() => handleProcessTransaction(item)}
            >
              <Text style={styles.processBtnText}>Process</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>
    );
  }, [colors, router, styles, selectedTab, currentDate, handleProcessTransaction, handleSkipOccurrence]);

  return (
    <SafeAreaView style={styles.container}>
      <BlurBackground />
      <Header title="Recurring" subtitle="Manage automatic entries" showBack />

      <View style={styles.tabBar}>
        {(['ACTIVE', 'DUE', 'ARCHIVED'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.activeTab]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </Text>
            {tab === 'DUE' && recurringTransactions?.some(t => {
              const d = parseISO(t.nextDate);
              return !t.isPaused && (d <= currentDate || isSameDay(d, currentDate));
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
          data={visibleRecurringTransactions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="sync-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>
                {selectedTab === 'DUE' ? 'No entries due' : selectedTab === 'ARCHIVED' ? 'No archived entries' : 'No recurring entries'}
              </Text>
              <Text style={styles.emptyText}>
                {selectedTab === 'DUE' ? 'You are all caught up!' : 'Automate your fixed income and expenses.'}
              </Text>
              {selectedTab === 'ACTIVE' && (
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
        visible={isManageDialogOpen}
        onClose={() => setIsManageDialogOpen(false)}
        title="Manage Recurring"
        subtitle={selectedTemplate?.name}
        options={manageOptions}
      />

      <ConfirmDialog
        visible={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        title="Delete Recurring"
        message="This will stop future automatic entries. Past entries will remain."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (selectedTemplate) {
            deleteRecurring(selectedTemplate.id);
            setSelectedTemplate(null);
          }
        }}
      />
    </SafeAreaView>
  );
});

