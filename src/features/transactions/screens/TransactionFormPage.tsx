import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React from 'react';
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
import { useSettings } from '../../../providers/SettingsProvider';
import { useTheme } from '../../../providers/ThemeProvider';
import { ThemeColors } from '../../../theme/colors';
import { RADIUS } from '../../../theme/tokens';
import { TYPOGRAPHY } from '../../../theme/typography';
import { useAccounts } from '../../accounts/hooks/accounts';
import { useCategories } from '../../categories/hooks/categories';
import {
  useCreateTransaction,
  useTransactionById,
  useUpdateTransaction,
} from '../hooks/transactions';
import { TransactionAmountInput } from '../components/TransactionAmountInput';
import { TransactionTypePicker } from '../components/TransactionTypePicker';
import { TransactionAccountPicker } from '../components/TransactionAccountPicker';
import { TransactionCategoryPicker } from '../components/TransactionCategoryPicker';
import { TransactionBudgetPicker } from '../components/TransactionBudgetPicker';
import { useBudgets } from '../../budgets/api/budgets';
import { format } from 'date-fns';
import { TransactionType } from '../../../types';

type Props = {
  mode: 'create' | 'edit';
  transactionId?: number | null;
};

const parseAmount = (raw: string): number => {
  const normalized = raw.replace(',', '.').replace(/[^0-9.]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function TransactionFormPage({ mode, transactionId }: Props) {
  const router = useRouter();
  const isEditMode = mode === 'edit';

  const { colors } = useTheme();
  const { profile } = useSettings();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const accountsQuery = useAccounts();
  const categoriesQuery = useCategories();
  const budgetsQuery = useBudgets();
  const transactionByIdQuery = useTransactionById(isEditMode ? transactionId ?? null : null);
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();

  const accounts = React.useMemo(() => accountsQuery.data ?? [], [accountsQuery.data]);
  const categories = React.useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const budgetsList = React.useMemo(() => budgetsQuery.data ?? [], [budgetsQuery.data]);
  const manualBudgets = React.useMemo(() => budgetsList.filter(b => b.mode === 'MANUAL'), [budgetsList]);
  const editingTransaction = React.useMemo(() => {
    if (!isEditMode) return null;
    return transactionByIdQuery.data ?? null;
  }, [transactionByIdQuery.data, isEditMode]);

  const [type, setType] = React.useState<TransactionType>('DR');
  const [selectedAccountId, setSelectedAccountId] = React.useState<number | null>(null);
  const [selectedToAccountId, setSelectedToAccountId] = React.useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<number | null>(null);
  const [selectedBudgetId, setSelectedBudgetId] = React.useState<number | null>(null);
  const [transactionDateTime, setTransactionDateTime] = React.useState<Date>(() => new Date());
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [showTimePicker, setShowTimePicker] = React.useState(false);
  const [amountInput, setAmountInput] = React.useState('');
  const [note, setNote] = React.useState('');

  React.useEffect(() => {
    if (!isEditMode || !editingTransaction) return;
    setType(editingTransaction.type);
    setSelectedAccountId(editingTransaction.accountId);
    setSelectedToAccountId(editingTransaction.toAccountId ?? null);
    setSelectedCategoryId(editingTransaction.categoryId ?? null);
    setSelectedBudgetId(editingTransaction.budgetId ?? null);
    setTransactionDateTime(new Date(editingTransaction.datetime));
    setAmountInput(String(editingTransaction.amount));
    setNote(editingTransaction.note ?? '');
  }, [isEditMode, editingTransaction]);

  const filteredCategories = React.useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type]
  );

  // Reset toAccount when switching away from transfer
  React.useEffect(() => {
    if (type !== 'TRANSFER') {
      setSelectedToAccountId(null);
    }
  }, [type]);


  React.useEffect(() => {
    if (accounts.length === 0) {
      setSelectedAccountId(null);
      return;
    }
    if (selectedAccountId === null || !accounts.some((account) => account.id === selectedAccountId)) {
      const preferred = accounts.find((account) => account.isDefault) ?? accounts[0];
      setSelectedAccountId(preferred.id);
    }
  }, [accounts, selectedAccountId]);

  React.useEffect(() => {
    if (filteredCategories.length === 0) {
      setSelectedCategoryId(null);
      return;
    }
    if (selectedCategoryId === null || !filteredCategories.some((category) => category.id === selectedCategoryId)) {
      setSelectedCategoryId(filteredCategories[0]?.id ?? null);
    }
  }, [filteredCategories, selectedCategoryId]);

  const selectedAccount = React.useMemo(
    () => accounts.find((account) => account.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId]
  );

  const eligibleToAccounts = React.useMemo(() => {
    if (!selectedAccount) return [];
    return accounts.filter(
      (account) => account.id !== selectedAccountId && account.currency === selectedAccount.currency
    );
  }, [accounts, selectedAccountId, selectedAccount]);

  // Reset toAccount when from account changes (currency might not match)
  React.useEffect(() => {
    if (type === 'TRANSFER' && selectedToAccountId !== null) {
      // Check if the currently selected toAccount is still valid for the new from account
      const isStillValid = eligibleToAccounts.some((acc) => acc.id === selectedToAccountId);
      if (!isStillValid) {
        setSelectedToAccountId(null);
      }
    }
  }, [selectedAccountId, type, eligibleToAccounts, selectedToAccountId]);

  const selectedToAccount = React.useMemo(
    () => accounts.find((account) => account.id === selectedToAccountId) ?? null,
    [accounts, selectedToAccountId]
  );

  const selectedCategory = React.useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId]
  );

  const amountValue = React.useMemo(() => parseAmount(amountInput), [amountInput]);

  const formattedDate = React.useMemo(
    () => format(transactionDateTime, 'EEE, d MMM yyyy'),
    [transactionDateTime]
  );

  const formattedTime = React.useMemo(
    () => format(transactionDateTime, 'HH:mm'),
    [transactionDateTime]
  );

  const onDatePicked = (event: DateTimePickerEvent, picked?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'set' && picked) {
      setTransactionDateTime((curr) => {
        const next = new Date(curr);
        next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
        return next;
      });
    }
  };

  const onTimePicked = (event: DateTimePickerEvent, picked?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (event.type === 'set' && picked) {
      setTransactionDateTime((curr) => {
        const next = new Date(curr);
        next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
        return next;
      });
    }
  };

  const isSubmitting = createTransaction.isPending || updateTransaction.isPending;

  const canSubmit = React.useMemo(() => {
    if (amountValue <= 0 || !selectedAccountId || !selectedCategoryId || isSubmitting) return false;
    if (type === 'TRANSFER') return !!selectedToAccountId;
    return true;
  }, [amountValue, selectedAccountId, selectedToAccountId, selectedCategoryId, isSubmitting, type]);

  const handleSave = async () => {
    if (amountValue <= 0 || !selectedAccountId) {
      Alert.alert('Missing details', 'Please select an account and enter a valid amount.');
      return;
    }

    if (type === 'TRANSFER' && !selectedToAccountId) {
      Alert.alert('Missing details', 'Please select a destination account for the transfer.');
      return;
    }

    if (!selectedCategoryId) {
      Alert.alert('Missing details', 'Please select a category.');
      return;
    }

    // Validate same currency for transfers
    if (type === 'TRANSFER' && selectedAccount && selectedToAccount) {
      if (selectedAccount.currency !== selectedToAccount.currency) {
        Alert.alert(
          'Currency mismatch',
          'Transfers are only allowed between accounts with the same currency.'
        );
        return;
      }

      // Validate sufficient balance for transfer
      if (amountValue > selectedAccount.balance) {
        Alert.alert(
          'Insufficient balance',
          `The transfer amount exceeds the available balance in ${selectedAccount.name} (${selectedAccount.balance.toFixed(2)} ${selectedAccount.currency}).`
        );
        return;
      }
    }

    const payload = {
      accountId: selectedAccountId,
      toAccountId: type === 'TRANSFER' ? selectedToAccountId : null,
      categoryId: selectedCategoryId,
      budgetId: type === 'DR' ? selectedBudgetId : null,
      amount: amountValue,
      type,
      datetime: transactionDateTime.toISOString(),
      note: note.trim() || (type === 'TRANSFER' 
        ? `Transfer to ${selectedToAccount?.name ?? 'account'}` 
        : selectedCategory?.name ?? 'Transaction'),
    };

    try {
      if (isEditMode && editingTransaction) {
        await updateTransaction.mutateAsync({ id: editingTransaction.id, data: payload });
      } else {
        await createTransaction.mutateAsync(payload);
      }
      router.back();
    } catch {
      Alert.alert('Unable to save', 'Could not save transaction. Please try again.');
    }
  };

  if ((accountsQuery.isLoading || categoriesQuery.isLoading || transactionByIdQuery.isLoading) && isEditMode) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <BlurBackground />
      <Header title={isEditMode ? 'Edit Entry' : 'New Entry'} subtitle="Record flow with precision" showBack />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={{ marginTop: 24, marginBottom: 16 }}>
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

        <TransactionTypePicker value={type} onChange={setType} colors={colors} disabled={isEditMode} />

        <TransactionAmountInput
          value={amountInput}
          onChange={setAmountInput}
          currency={selectedAccount?.currency ?? profile.defaultCurrency}
          colors={colors}
        />

        <View style={styles.formBody}>
          <TransactionAccountPicker
            accounts={accounts}
            selectedId={selectedAccountId}
            onSelect={setSelectedAccountId}
            onAdd={() => router.push('/account/create')}
            colors={colors}
            label={type === 'TRANSFER' ? 'From Account' : 'Account'}
          />

          {type === 'TRANSFER' && (
            <>
              {eligibleToAccounts.length > 0 ? (
                <TransactionAccountPicker
                  accounts={eligibleToAccounts}
                  selectedId={selectedToAccountId}
                  onSelect={setSelectedToAccountId}
                  onAdd={() => router.push('/account/create')}
                  colors={colors}
                  label="To Account"
                />
              ) : (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>TO ACCOUNT</Text>
                  <View style={[styles.disabledCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.disabledText, { color: colors.textMuted }]}>
                      {!selectedAccount
                        ? 'Select source account first'
                        : 'No accounts with same currency available'}
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}

          <TransactionCategoryPicker
            categories={filteredCategories}
            selectedId={selectedCategoryId}
            onSelect={setSelectedCategoryId}
            onAdd={() => router.push('/category/create')}
            colors={colors}
          />

          {type === 'DR' && manualBudgets.length > 0 && (
            <TransactionBudgetPicker
              budgetsList={manualBudgets}
              selectedId={selectedBudgetId}
              onSelect={setSelectedBudgetId}
              colors={colors}
            />
          )}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DATE & TIME</Text>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity style={styles.dateTimeBtn} onPress={() => setShowDatePicker(true)}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                <Text style={styles.dateTimeText}>{formattedDate}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dateTimeBtn} onPress={() => setShowTimePicker(true)}>
                <Ionicons name="time-outline" size={18} color={colors.primary} />
                <Text style={styles.dateTimeText}>{formattedTime}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {showDatePicker && (
            <DateTimePicker value={transactionDateTime} mode="date" display="default" onChange={onDatePicked} />
          )}
          {showTimePicker && (
            <DateTimePicker value={transactionDateTime} mode="time" display="default" onChange={onTimePicked} />
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, !canSubmit && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!canSubmit}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Text style={styles.saveBtnText}>{isEditMode ? 'Save Changes' : 'Save Transaction'}</Text>
          )}
        </TouchableOpacity>
      </View>

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
    dateTimeRow: {
      flexDirection: 'row',
      gap: 12,
    },
    dateTimeBtn: {
      flex: 1,
      height: 48,
      borderRadius: RADIUS.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    dateTimeText: {
      fontFamily: TYPOGRAPHY.fonts.medium,
      fontSize: 13,
      color: colors.text,
    },
    noteContainer: {
      borderRadius: RADIUS.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
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
    disabledCard: {
      height: 56,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    disabledText: {
      fontFamily: TYPOGRAPHY.fonts.medium,
      fontSize: 14,
    },
    accountList: {
      gap: 8,
    },
    accountCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderRadius: RADIUS.full,
      borderWidth: 1,
    },
    accountIconBox: {
      width: 36,
      height: 36,
      borderRadius: RADIUS.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    accountName: {
      flex: 1,
      fontFamily: TYPOGRAPHY.fonts.medium,
      fontSize: 15,
    },
  });
