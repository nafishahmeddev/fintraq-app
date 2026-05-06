import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, Input, SectionLabel } from '../../../components/ui';
import { PersonPickerDialog } from '../../../components/ui/PersonPickerDialog';
import { PlacePickerDialog } from '../../../components/ui/PlacePickerDialog';
import { useSettings } from '../../../providers/SettingsProvider';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { TransactionType } from '../../../types';
import { useAccounts } from '../../accounts/hooks/accounts';
import { useBudgets } from '../../budgets/api/budgets';
import { useCategories } from '../../categories/hooks/categories';
import { useGoalById } from '../../goals/api/goals';
import { useLoanById } from '../../loans/api/loans';
import { TransactionAccountPicker } from '../components/TransactionAccountPicker';
import { TransactionAmountInput } from '../components/TransactionAmountInput';
import { TransactionBudgetPicker } from '../components/TransactionBudgetPicker';
import { TransactionCategoryPicker } from '../components/TransactionCategoryPicker';
import { TransactionGoalPicker } from '../components/TransactionGoalPicker';
import { TransactionLoanPicker } from '../components/TransactionLoanPicker';
import { TransactionTypePicker } from '../components/TransactionTypePicker';
import {
  useCreateTransaction,
  useTransactionById,
  useUpdateTransaction,
} from '../hooks/transactions';

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
  const params = useLocalSearchParams<{ goalId?: string; loanId?: string }>();
  const isEditMode = mode === 'edit';

  const theme = useTheme();
  const { colors } = theme;
  const { profile } = useSettings();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const accountsQuery = useAccounts();
  const categoriesQuery = useCategories();
  const budgetsQuery = useBudgets();
  const transactionByIdQuery = useTransactionById(isEditMode ? transactionId ?? null : null);
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();

  const { data: paramGoal } = useGoalById(params.goalId ? parseInt(params.goalId, 10) : null);
  const { data: paramLoan } = useLoanById(params.loanId ? parseInt(params.loanId, 10) : null);

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
  const [selectedGoalId, setSelectedGoalId] = React.useState<number | null>(() =>
    params.goalId ? parseInt(params.goalId, 10) : null
  );
  const [selectedLoanId, setSelectedLoanId] = React.useState<number | null>(() =>
    params.loanId ? parseInt(params.loanId, 10) : null
  );
  const [selectedPersonId, setSelectedPersonId] = React.useState<number | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = React.useState<number | null>(null);
  const [transactionDateTime, setTransactionDateTime] = React.useState<Date>(() => new Date());
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [showTimePicker, setShowTimePicker] = React.useState(false);
  const [showPersonPicker, setShowPersonPicker] = React.useState(false);
  const [showPlacePicker, setShowPlacePicker] = React.useState(false);
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
    setSelectedGoalId(editingTransaction.goalId ?? null);
    setSelectedLoanId(editingTransaction.loanId ?? null);
    setSelectedPersonId(editingTransaction.personId ?? null);
    setSelectedPlaceId(editingTransaction.placeId ?? null);
  }, [isEditMode, editingTransaction]);

  React.useEffect(() => {
    if (!isEditMode) {
      if (paramGoal?.accountId) {
        setSelectedAccountId(paramGoal.accountId);
      } else if (paramLoan?.accountId) {
        setSelectedAccountId(paramLoan.accountId);
      }
    }
  }, [paramGoal, paramLoan, isEditMode]);

  const filteredCategories = React.useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type]
  );

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

  React.useEffect(() => {
    if (type === 'TRANSFER' && selectedToAccountId !== null) {
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

    if (type === 'TRANSFER' && selectedAccount && selectedToAccount) {
      if (selectedAccount.currency !== selectedToAccount.currency) {
        Alert.alert(
          'Currency mismatch',
          'Transfers are only allowed between accounts with the same currency.'
        );
        return;
      }

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
      goalId: selectedGoalId,
      loanId: selectedLoanId,
      personId: selectedPersonId,
      placeId: selectedPlaceId,
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
      <Header title={isEditMode ? 'Edit entry' : 'New entry'} showBack />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">




        <TransactionTypePicker value={type} onChange={setType} disabled={isEditMode} />





        <View style={styles.formBody}>

          <View style={styles.amountWrap}>
            <TransactionAmountInput
              value={amountInput}
              onChange={setAmountInput}
              currency={selectedAccount?.currency ?? profile.defaultCurrency}
            />
          </View>

          <View style={styles.section}>
            <SectionLabel size="sm" text="Note" />
            <Input
              value={note}
              onChangeText={setNote}
              placeholder="Optional context"
              multiline
              numberOfLines={3}
              style={styles.noteInput}
            />
          </View>
          <TransactionAccountPicker
            accounts={accounts}
            selectedId={selectedAccountId}
            onSelect={setSelectedAccountId}
            onAdd={() => router.push('/accounts/create')}
            label={type === 'TRANSFER' ? 'From Account' : 'Account'}
          />

          {type === 'TRANSFER' && (
            <>
              {eligibleToAccounts.length > 0 ? (
                <TransactionAccountPicker
                  accounts={eligibleToAccounts}
                  selectedId={selectedToAccountId}
                  onSelect={setSelectedToAccountId}
                  onAdd={() => router.push('/accounts/create')}
                  label="To Account"
                />
              ) : (
                <View style={styles.section}>
                  <SectionLabel size="sm" text="To account" />
                  <View style={styles.disabledCard}>
                    <Text style={styles.disabledText}>
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
            onAdd={() => router.push('/categories/create')}
          />

          {type === 'DR' && manualBudgets.length > 0 && (
            <TransactionBudgetPicker
              budgetsList={manualBudgets}
              selectedId={selectedBudgetId}
              onSelect={setSelectedBudgetId}
            />
          )}

          <TransactionGoalPicker
            selectedId={selectedGoalId}
            onSelect={setSelectedGoalId}
            accountId={selectedAccountId}
            type={type}
          />

          <TransactionLoanPicker
            selectedId={selectedLoanId}
            onSelect={setSelectedLoanId}
            accountId={selectedAccountId}
            type={type}
          />

          <View style={styles.section}>
            <SectionLabel size="sm" text="Person (optional)" />
            <TouchableOpacity
              style={styles.pickerBtn}
              onPress={() => setShowPersonPicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="person-outline" size={18} color={colors.primary} />
              <Text style={[styles.pickerBtnText, { color: selectedPersonId ? colors.text : colors.textMuted }]}>
                {selectedPersonId ? 'Person linked' : 'Link a person'}
              </Text>
              <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <SectionLabel size="sm" text="Place (optional)" />
            <TouchableOpacity
              style={styles.pickerBtn}
              onPress={() => setShowPlacePicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="location-outline" size={18} color={colors.primary} />
              <Text style={[styles.pickerBtnText, { color: selectedPlaceId ? colors.text : colors.textMuted }]}>
                {selectedPlaceId ? 'Place linked' : 'Link a place'}
              </Text>
              <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <SectionLabel size="sm" text="Date & time" />
            <View style={styles.dateTimeRow}>
              <TouchableOpacity style={styles.dateTimeBtn} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                <Text style={styles.dateTimeText}>{formattedDate}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dateTimeBtn} onPress={() => setShowTimePicker(true)} activeOpacity={0.7}>
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
          activeOpacity={0.9}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <Text style={styles.saveBtnText}>{isEditMode ? 'Save changes' : 'Save transaction'}</Text>
          )}
        </TouchableOpacity>
      </View>

      <PersonPickerDialog
        visible={showPersonPicker}
        onClose={() => setShowPersonPicker(false)}
        selectedId={selectedPersonId}
        onSelect={setSelectedPersonId}
        onAddPerson={() => router.push('/people/create')}
      />

      <PlacePickerDialog
        visible={showPlacePicker}
        onClose={() => setShowPlacePicker(false)}
        selectedId={selectedPlaceId}
        onSelect={setSelectedPlaceId}
        onAddPlace={() => router.push('/places/create')}
      />
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingWrap: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    content: {
      paddingBottom: 140,
    },
    amountWrap: {
      paddingHorizontal: theme.layout.screenPadding,
    },
    formBody: {
      gap: theme.spacing[16],
    },
    section: {
      paddingHorizontal: theme.layout.screenPadding,
      gap: theme.spacing[12],
    },
    noteInput: {
      textAlignVertical: 'top',
    },
    dateTimeRow: {
      flexDirection: 'row',
      gap: theme.spacing[12],
    },
    dateTimeBtn: {
      flex: 1,
      height: 48,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing[8],
    },
    dateTimeText: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 12,
      color: theme.colors.text,
    },
    pickerBtn: {
      height: 48,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing[16],
      gap: theme.spacing[12],
      backgroundColor: theme.colors.surface,
    },
    pickerBtnText: {
      flex: 1,
      fontFamily: theme.fontFamilies.sansMedium,
      fontSize: 14,
    },
    footer: {
      position: 'absolute',
      bottom: 34,
      left: theme.layout.screenPadding,
      right: theme.layout.screenPadding,
    },
    saveBtn: {
      height: 56,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadow.md,
    },
    saveBtnDisabled: {
      opacity: 0.5,
    },
    saveBtnText: {
      fontFamily: theme.fontFamilies.sansBold,
      fontSize: 16,
      color: theme.colors.onPrimary,
    },
    disabledCard: {
      height: 48,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      borderStyle: 'dashed',
    },
    disabledText: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 14,
      color: theme.colors.textMuted,
    },
  });
