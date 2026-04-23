import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurBackground } from '../../../components/ui/BlurBackground';
import { Header } from '../../../components/ui/Header';
import { IconPickerDialog } from '../../../components/ui/IconPickerDialog';
import { ACCOUNT_COLORS } from '../../../constants/picker';
import { RECURRING_INTERVAL_UNITS, RecurringEndCondition, RecurringFrequency, RecurringIntervalUnit } from '../../../db/schema';
import { usePremium } from '../../../providers/PremiumProvider';
import { useSettings } from '../../../providers/SettingsProvider';
import { useTheme } from '../../../providers/ThemeProvider';
import { NotificationService } from '../../../services/notification.service';
import { ThemeColors } from '../../../theme/colors';
import { RADIUS } from '../../../theme/tokens';
import { TYPOGRAPHY } from '../../../theme/typography';
import { formatCurrency, toDbColor } from '../../../utils/format';
import { resolveIcon } from '../../../utils/icons';
import { useAccounts } from '../../accounts/hooks/accounts';
import { useCategories } from '../../categories/hooks/categories';
import { TransactionAccountPicker } from '../../transactions/components/TransactionAccountPicker';
import { TransactionAmountInput } from '../../transactions/components/TransactionAmountInput';
import { TransactionCategoryPicker } from '../../transactions/components/TransactionCategoryPicker';
import { TransactionTypePicker } from '../../transactions/components/TransactionTypePicker';
import { useCreateRecurring, useRecurringById, useRecurringTransactions, useUpdateRecurring } from '../api/recurring';

type Props = {
  mode: 'create' | 'edit';
  recurringId?: number | null;
};

const parseAmount = (raw: string): number => {
  const normalized = raw.replace(',', '.').replace(/[^0-9.]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const FREQUENCIES: { label: string; value: RecurringFrequency }[] = [
  { label: 'Daily', value: 'DAILY' },
  { label: 'Weekly', value: 'WEEKLY' },
  { label: 'Bi-weekly', value: 'BI_WEEKLY' },
  { label: 'Monthly', value: 'MONTHLY' },
  { label: 'Quarterly', value: 'QUARTERLY' },
  { label: 'Yearly', value: 'YEARLY' },
  { label: 'Custom', value: 'CUSTOM' },
];

const END_CONDITIONS: { label: string; value: RecurringEndCondition }[] = [
  { label: 'Never', value: 'NEVER' },
  { label: 'After X times', value: 'AFTER_OCCURRENCES' },
  { label: 'On date', value: 'ON_DATE' },
];

export function RecurringFormPage({ mode, recurringId }: Props) {
  const router = useRouter();
  const isEditMode = mode === 'edit';

  const { colors } = useTheme();
  const { profile } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const accountsQuery = useAccounts();
  const categoriesQuery = useCategories();
  const recurringByIdQuery = useRecurringById(isEditMode ? recurringId ?? null : null);
  const recurringTransactionsQuery = useRecurringTransactions();
  const createRecurring = useCreateRecurring();
  const updateRecurring = useUpdateRecurring();
  const { isPremium, showAlert } = usePremium();

  const accounts = useMemo(() => accountsQuery.data ?? [], [accountsQuery.data]);
  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const editingData = useMemo(() => {
    if (!isEditMode) return null;
    return recurringByIdQuery.data ?? null;
  }, [recurringByIdQuery.data, isEditMode]);

  const [type, setType] = useState<'CR' | 'DR'>('DR');
  const [name, setName] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('MONTHLY');
  const [interval, setInterval] = useState('1');
  const [intervalUnit, setIntervalUnit] = useState<RecurringIntervalUnit>('DAYS');
  const [startDate, setStartDate] = useState<Date>(() => new Date());
  const [endCondition, setEndCondition] = useState<RecurringEndCondition>('NEVER');
  const [endValue, setEndValue] = useState('');
  const [colorHex, setColorHex] = useState<string>(ACCOUNT_COLORS[0]);
  const [iconKey, setIconKey] = useState<string>('sync-outline');
  const [reminderDays, setReminderDays] = useState(0);

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    if (!isEditMode || !editingData) return;
    setType(editingData.type as 'CR' | 'DR');
    setName(editingData.name);
    setAmountInput(String(editingData.amount));
    setSelectedAccountId(editingData.accountId);
    setSelectedCategoryId(editingData.categoryId);
    setNote(editingData.note ?? '');
    setFrequency(editingData.frequency as RecurringFrequency);
    setInterval(String(editingData.interval || 1));
    setIntervalUnit((editingData.intervalUnit as RecurringIntervalUnit) || 'DAYS');
    setStartDate(new Date(editingData.startDate));
    setEndCondition(editingData.endCondition as RecurringEndCondition);
    setEndValue(editingData.endValue ?? '');
    setColorHex(`#${editingData.color.toString(16).padStart(6, '0').toUpperCase()}`);
    setIconKey(`${editingData.icon}-outline`);
    setReminderDays(editingData.reminderDays || 0);
  }, [isEditMode, editingData]);

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type]
  );

  useEffect(() => {
    if (accounts.length === 0) {
      setSelectedAccountId(null);
      return;
    }
    if (selectedAccountId === null || !accounts.some((account) => account.id === selectedAccountId)) {
      const preferred = accounts.find((account) => account.isDefault) ?? accounts[0];
      setSelectedAccountId(preferred.id);
    }
  }, [accounts, selectedAccountId]);

  useEffect(() => {
    if (filteredCategories.length === 0) {
      setSelectedCategoryId(null);
      return;
    }
    if (selectedCategoryId === null || !filteredCategories.some((category) => category.id === selectedCategoryId)) {
      setSelectedCategoryId(filteredCategories[0]?.id ?? null);
    }
  }, [filteredCategories, selectedCategoryId]);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId]
  );

  const amountValue = useMemo(() => parseAmount(amountInput), [amountInput]);

  const formattedStartDate = useMemo(
    () => format(startDate, 'EEE, d MMM yyyy'),
    [startDate]
  );

  const onStartDatePicked = (event: DateTimePickerEvent, picked?: Date) => {
    if (Platform.OS === 'android') setShowStartDatePicker(false);
    if (event.type === 'set' && picked) {
      setStartDate(picked);
    }
  };

  const onEndDatePicked = (event: DateTimePickerEvent, picked?: Date) => {
    if (Platform.OS === 'android') setShowEndDatePicker(false);
    if (event.type === 'set' && picked) {
      setEndValue(picked.toISOString());
    }
  };

  const isSubmitting = createRecurring.isPending || updateRecurring.isPending;

  const canSubmit = useMemo(() => {
    if (!name.trim() || amountValue <= 0 || !selectedAccountId || !selectedCategoryId || isSubmitting) return false;
    if (frequency === 'CUSTOM' && (!interval || isNaN(Number(interval)) || Number(interval) <= 0)) return false;
    if (endCondition === 'AFTER_OCCURRENCES' && (!endValue || isNaN(Number(endValue)) || Number(endValue) <= 0)) return false;
    if (endCondition === 'ON_DATE' && !endValue) return false;
    return true;
  }, [name, amountValue, selectedAccountId, selectedCategoryId, isSubmitting, endCondition, endValue, frequency, interval]);

  const onSavePress = async () => {
    if (!canSubmit) return;

    const recurringTransactionPayload = {
      name: name.trim(),
      amount: amountValue,
      type,
      categoryId: selectedCategoryId,
      accountId: selectedAccountId!,
      note: note.trim(),
      icon: iconKey.replace('-outline', ''),
      color: toDbColor(colorHex),
      frequency,
      interval: frequency === 'CUSTOM' ? parseInt(interval, 10) : 1,
      intervalUnit: frequency === 'CUSTOM' ? intervalUnit : 'DAYS',
      startDate: startDate.toISOString(),
      nextDate: startDate.toISOString(),
      endCondition,
      endValue: endCondition === 'NEVER' ? null : endValue,
      reminderDays,
    };

    if (!isEditMode && !isPremium) {
      const activeCount = recurringTransactionsQuery.data?.length ?? 0;
      if (activeCount >= 3) {
        showAlert({
          title: 'Premium Required',
          message: 'Free users can create up to 3 recurring transactions. Upgrade to Pro for unlimited automation.',
          type: 'warning',
          buttons: [
            { text: 'Maybe Later', style: 'cancel' },
            { text: 'View Pro Plans', onPress: () => router.push('/premium') },
          ],
        });
        return;
      }
    }

    try {
      if (isEditMode && editingData) {
        const nextDate = new Date(editingData.startDate).getTime() === startDate.getTime()
          ? editingData.nextDate
          : startDate.toISOString();

        const updated = await updateRecurring.mutateAsync({
          id: editingData.id,
          data: { ...recurringTransactionPayload, nextDate }
        });

        if (updated) {
          await NotificationService.scheduleRecurringReminder(
            updated.id,
            updated.name,
            formatCurrency(updated.amount, selectedAccount?.currency || profile.defaultCurrency),
            updated.nextDate,
            updated.reminderDays
          );
        }
      } else {
        const created = await createRecurring.mutateAsync(recurringTransactionPayload);
        if (created) {
          await NotificationService.scheduleRecurringReminder(
            created.id,
            created.name,
            formatCurrency(created.amount, selectedAccount?.currency || profile.defaultCurrency),
            created.nextDate,
            created.reminderDays
          );
        }
      }
      router.back();
    } catch (error) {
      console.log(error)
      Alert.alert('Unable to save', 'Could not save recurring transaction. Please try again.');
    }
  };

  if ((accountsQuery.isLoading || categoriesQuery.isLoading || recurringByIdQuery.isLoading) && isEditMode) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <BlurBackground />
      <Header title={isEditMode ? 'Edit Recurring' : 'New Recurring'} subtitle="Automate your flow" showBack />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <TransactionTypePicker
          value={type}
          onChange={(v) => {
            if (v === 'CR' || v === 'DR') setType(v);
          }}
          colors={colors}
          allowedTypes={['DR', 'CR']}
        />

        <TransactionAmountInput
          value={amountInput}
          onChange={setAmountInput}
          currency={selectedAccount?.currency ?? profile.defaultCurrency}
          colors={colors}
        />

        <View style={styles.formBody}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>NAME</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Netflix Subscription"
                placeholderTextColor={colors.textMuted + '80'}
              />
            </View>
          </View>

          <TransactionAccountPicker
            accounts={accounts}
            selectedId={selectedAccountId}
            onSelect={setSelectedAccountId}
            onAdd={() => router.push('/account/create')}
            colors={colors}
            label="Account"
          />

          <TransactionCategoryPicker
            categories={filteredCategories}
            selectedId={selectedCategoryId}
            onSelect={setSelectedCategoryId}
            onAdd={() => router.push('/category/create')}
            colors={colors}
          />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>FREQUENCY</Text>
            <View style={styles.grid}>
              {FREQUENCIES.map((f) => (
                <TouchableOpacity
                  key={f.value}
                  style={[styles.gridBtn, frequency === f.value && { backgroundColor: colors.text, borderColor: colors.text }]}
                  onPress={() => setFrequency(f.value)}
                >
                  <Text style={[styles.gridBtnText, frequency === f.value && { color: colors.background }]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {frequency === 'CUSTOM' && (
              <View style={styles.customFreqRow}>
                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <TextInput
                    style={styles.textInput}
                    value={interval}
                    onChangeText={setInterval}
                    placeholder="Interval"
                    keyboardType="number-pad"
                    placeholderTextColor={colors.textMuted + '80'}
                  />
                </View>
                <View style={styles.intervalUnitGrid}>
                  {RECURRING_INTERVAL_UNITS.map((unit) => (
                    <TouchableOpacity
                      key={unit}
                      style={[
                        styles.unitBtn,
                        intervalUnit === unit && { backgroundColor: colors.text, borderColor: colors.text }
                      ]}
                      onPress={() => setIntervalUnit(unit)}
                    >
                      <Text style={[styles.unitBtnText, intervalUnit === unit && { color: colors.background }]}>
                        {unit.toLowerCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>REMINDER</Text>
            <View style={styles.grid}>
              {[0, 1, 3, 7].map((dayOption) => (
                <TouchableOpacity
                  key={dayOption}
                  style={[
                    styles.gridBtn,
                    reminderDays === dayOption && { backgroundColor: colors.text, borderColor: colors.text }
                  ]}
                  onPress={() => setReminderDays(dayOption)}
                >
                  <Text style={[styles.gridBtnText, reminderDays === dayOption && { color: colors.background }]}>
                    {dayOption === 0 ? 'No reminder' : `${dayOption} day${dayOption > 1 ? 's' : ''} before`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>START DATE</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowStartDatePicker(true)}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <Text style={styles.dateBtnText}>{formattedStartDate}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>END CONDITION</Text>
            <View style={styles.grid}>
              {END_CONDITIONS.map((c) => (
                <TouchableOpacity
                  key={c.value}
                  style={[styles.gridBtn, endCondition === c.value && { backgroundColor: colors.text, borderColor: colors.text }]}
                  onPress={() => {
                    setEndCondition(c.value);
                    if (c.value === 'AFTER_OCCURRENCES') setEndValue('10');
                    if (c.value === 'ON_DATE') setEndValue(new Date().toISOString());
                  }}
                >
                  <Text style={[styles.gridBtnText, endCondition === c.value && { color: colors.background }]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {endCondition === 'AFTER_OCCURRENCES' && (
              <View style={[styles.inputContainer, { marginTop: 12 }]}>
                <TextInput
                  style={styles.textInput}
                  value={endValue}
                  onChangeText={setEndValue}
                  placeholder="Number of occurrences"
                  placeholderTextColor={colors.textMuted + '80'}
                  keyboardType="number-pad"
                />
              </View>
            )}

            {endCondition === 'ON_DATE' && (
              <TouchableOpacity style={[styles.dateBtn, { marginTop: 12 }]} onPress={() => setShowEndDatePicker(true)}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                <Text style={styles.dateBtnText}>
                  {endValue ? format(new Date(endValue), 'EEE, d MMM yyyy') : 'Select Date'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>APPEARANCE</Text>
            <View style={styles.appearanceRow}>
              <TouchableOpacity
                style={[styles.appearanceBtn, { borderColor: colorHex }]}
                onPress={() => setShowIconPicker(true)}
              >
                <Ionicons name={resolveIcon(iconKey, 'sync-outline')} size={24} color={colorHex} />
                <Text style={styles.appearanceBtnText}>Icon</Text>
              </TouchableOpacity>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorScroll}>
                {ACCOUNT_COLORS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    activeOpacity={0.9}
                    onPress={() => setColorHex(item)}
                    style={[
                      styles.colorCell,
                      { backgroundColor: item },
                      colorHex === item && styles.colorCellActive,
                    ]}
                  >
                    {colorHex === item ? <Ionicons name="checkmark" size={14} color="#000100" /> : null}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>NOTE</Text>
            <View style={styles.noteContainer}>
              <TextInput
                style={styles.noteInput}
                value={note}
                onChangeText={setNote}
                placeholder="Optional context"
                placeholderTextColor={colors.textMuted + '80'}
                multiline
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, !canSubmit && styles.saveBtnDisabled]}
          onPress={onSavePress}
          disabled={!canSubmit}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Text style={styles.saveBtnText}>{isEditMode ? 'Save Changes' : 'Create Recurring'}</Text>
          )}
        </TouchableOpacity>
      </View>

      {showStartDatePicker && (
        <DateTimePicker value={startDate} mode="date" display="default" onChange={onStartDatePicked} />
      )}
      {showEndDatePicker && endValue && (
        <DateTimePicker value={new Date(endValue)} mode="date" display="default" onChange={onEndDatePicked} />
      )}

      <IconPickerDialog
        visible={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        selectedIcon={iconKey}
        onSelect={setIconKey}
        title="Select Icon"
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingWrap: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    content: {
      paddingBottom: 120,
    },
    formBody: {
      gap: 16,
    },
    section: {
      paddingHorizontal: 24,
      gap: 12,
    },
    sectionLabel: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 1.5,
    },
    inputContainer: {
      height: 48,
      borderRadius: RADIUS.xl,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      justifyContent: 'center',
    },
    textInput: {
      fontFamily: TYPOGRAPHY.fonts.medium,
      fontSize: 15,
      color: colors.text,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    gridBtn: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: RADIUS.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    gridBtnText: {
      fontFamily: TYPOGRAPHY.fonts.medium,
      fontSize: 13,
      color: colors.text,
    },
    dateBtn: {
      height: 48,
      borderRadius: RADIUS.xl,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    dateBtnText: {
      fontFamily: TYPOGRAPHY.fonts.medium,
      fontSize: 14,
      color: colors.text,
    },
    appearanceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    appearanceBtn: {
      width: 72,
      height: 72,
      borderRadius: RADIUS.xl,
      backgroundColor: colors.surface,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 4,
    },
    appearanceBtnText: {
      fontFamily: TYPOGRAPHY.fonts.medium,
      fontSize: 11,
      color: colors.textMuted,
    },
    colorScroll: {
      alignItems: 'center',
      gap: 12,
      paddingRight: 24,
    },
    colorCell: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.full,
      borderWidth: 2,
      borderColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    colorCellActive: {
      borderColor: colors.text,
      transform: [{ scale: 1.1 }],
    },
    noteContainer: {
      borderRadius: RADIUS.xl,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      minHeight: 100,
    },
    noteInput: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 15,
      color: colors.text,
      textAlignVertical: 'top',
    },
    footer: {
      position: 'absolute',
      bottom: 34,
      left: 24,
      right: 24,
    },
    saveBtn: {
      height: 56,
      borderRadius: RADIUS.full,
      backgroundColor: colors.text,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveBtnDisabled: {
      opacity: 0.5,
    },
    saveBtnText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 16,
      color: colors.background,
    },
    customFreqRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
      alignItems: 'center',
    },
    intervalUnitGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      flex: 2,
    },
    unitBtn: {
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: RADIUS.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    unitBtnText: {
      fontFamily: TYPOGRAPHY.fonts.medium,
      fontSize: 11,
      color: colors.text,
      textTransform: 'capitalize',
    },
  });
