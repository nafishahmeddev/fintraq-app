import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
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
import { Header } from '../../../components/ui/Header';
import { ACCOUNT_COLORS } from '../../../constants/picker';
import { BudgetMode, BudgetPeriod, BudgetScope } from '../../../db/schema';
import { usePremium } from '../../../providers/PremiumProvider';
import { useSettings } from '../../../providers/SettingsProvider';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { toDbColor } from '../../../utils/format';
import { resolveIcon } from '../../../utils/icons';
import { useAccounts } from '../../accounts/hooks/accounts';
import { useCategories } from '../../categories/hooks/categories';
import { TransactionAmountInput } from '../../transactions/components/TransactionAmountInput';
import { useBudgetById, useBudgets, useCreateBudget, useUpdateBudget } from '../api/budgets';

const toHexColor = (value: number) => `#${value.toString(16).padStart(6, '0')}`;

type Props = {
  mode: 'create' | 'edit';
  budgetId?: number | null;
};

const parseAmount = (raw: string): number => {
  const normalized = raw.replace(',', '.').replace(/[^0-9.]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const PERIODS: { label: string; value: BudgetPeriod }[] = [
  { label: 'Daily', value: 'DAILY' },
  { label: 'Weekly', value: 'WEEKLY' },
  { label: 'Monthly', value: 'MONTHLY' },
  { label: 'Yearly', value: 'YEARLY' },
  { label: 'Custom range', value: 'CUSTOM' },
];

const MODES: { label: string; value: BudgetMode; desc: string }[] = [
  { label: 'Auto', value: 'AUTO', desc: 'Automatically links matching transactions' },
  { label: 'Manual', value: 'MANUAL', desc: 'Manually select this budget on transactions' },
];

const SCOPES: { label: string; value: BudgetScope; desc: string }[] = [
  { label: 'Overall', value: 'OVERALL', desc: 'Tracks everything. Exclude specific categories below.' },
  { label: 'Category', value: 'CATEGORY', desc: 'Tracks only the specific categories you include below.' },
];

export function BudgetFormPage({ mode: formMode, budgetId }: Props) {
  const router = useRouter();
  const isEditMode = formMode === 'edit';

  const theme = useTheme();
  const { colors } = theme;
  const { profile } = useSettings();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const categoriesQuery = useCategories();
  const accountsQuery = useAccounts();
  const budgetByIdQuery = useBudgetById(isEditMode ? budgetId ?? null : null);
  const budgetsQuery = useBudgets();
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const { isPremium, showAlert } = usePremium();

  const categories = useMemo(() => categoriesQuery.data?.filter(c => c.type === 'DR') ?? [], [categoriesQuery.data]);
  const accounts = useMemo(() => accountsQuery.data ?? [], [accountsQuery.data]);

  const editingData = useMemo(() => {
    if (!isEditMode) return null;
    return budgetByIdQuery.data ?? null;
  }, [budgetByIdQuery.data, isEditMode]);

  const [name, setName] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [period, setPeriod] = useState<BudgetPeriod>('MONTHLY');
  const [mode, setMode] = useState<BudgetMode>('AUTO');
  const [scope, setScope] = useState<BudgetScope>('OVERALL');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);
  const [colorHex, setColorHex] = useState<string>(ACCOUNT_COLORS[0]);
  const [isRolling, setIsRolling] = useState(false);
  const [startDate, setStartDate] = useState<Date>(() => new Date());
  const [endDate, setEndDate] = useState<Date>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d;
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  useEffect(() => {
    if (!isEditMode || !editingData) return;
    setName(editingData.name);
    setAmountInput(String(editingData.amount));
    setPeriod(editingData.period as BudgetPeriod);
    setMode(editingData.mode as BudgetMode);
    setScope(editingData.scope as BudgetScope);

    try {
      const cats = JSON.parse(editingData.categoryIds || '[]');
      if (Array.isArray(cats)) setSelectedCategories(cats);
    } catch {
      setSelectedCategories([]);
    }

    try {
      const accs = JSON.parse(editingData.accountIds || '[]');
      if (Array.isArray(accs)) setSelectedAccounts(accs);
    } catch {
      setSelectedAccounts([]);
    }

    if (editingData.color) {
      setColorHex(toHexColor(editingData.color));
    }
    setIsRolling(editingData.isRolling);
    if (editingData.startDate) setStartDate(new Date(editingData.startDate));
    if (editingData.endDate) setEndDate(new Date(editingData.endDate));
  }, [isEditMode, editingData]);

  const amountValue = useMemo(() => parseAmount(amountInput), [amountInput]);

  const toggleCategory = (id: number) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleAccount = (id: number) => {
    setSelectedAccounts(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const isSubmitting = createBudget.isPending || updateBudget.isPending;

  const canSubmit = useMemo(() => {
    if (!name.trim() || amountValue <= 0 || isSubmitting) return false;
    return true;
  }, [name, amountValue, isSubmitting]);

  const handleSave = async () => {
    if (!canSubmit) return;

    const payload = {
      name: name.trim(),
      amount: amountValue,
      period,
      mode,
      scope,
      categoryIds: JSON.stringify(selectedCategories),
      accountIds: JSON.stringify(selectedAccounts),
      color: toDbColor(colorHex),
      isRolling,
      startDate: period === 'CUSTOM' ? startDate.toISOString() : null,
      endDate: period === 'CUSTOM' ? endDate.toISOString() : null,
    };

    if (!isEditMode && !isPremium) {
      const activeCount = budgetsQuery.data?.length ?? 0;
      if (activeCount >= 2) {
        showAlert({
          title: 'Pro Feature',
          message: 'Free users can manage up to 2 active budgets. Upgrade to Pro for unlimited tracking and advanced insights.',
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
        await updateBudget.mutateAsync({ id: editingData.id, data: payload });
      } else {
        await createBudget.mutateAsync(payload);
      }
      router.back();
    } catch {
      Alert.alert('Unable to save', 'Could not save budget. Please try again.');
    }
  };

  if ((categoriesQuery.isLoading || accountsQuery.isLoading || budgetByIdQuery.isLoading) && isEditMode) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      <Header title={isEditMode ? 'Edit budget' : 'New budget'} subtitle="Set your spending limit" showBack />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={{ marginTop: 24, marginBottom: 16 }}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Groceries Budget"
                placeholderTextColor={colors.textMuted + '80'}
              />
            </View>
          </View>
        </View>

        <TransactionAmountInput
          value={amountInput}
          onChange={setAmountInput}
          currency={profile.defaultCurrency}
        />

        <View style={styles.formBody}>


          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Period</Text>
            <View style={styles.grid}>
              {PERIODS.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  style={[styles.gridBtn, period === p.value && { backgroundColor: colors.text, borderColor: colors.text }]}
                  onPress={() => setPeriod(p.value)}
                >
                  <Text style={[styles.gridBtnText, period === p.value && { color: colors.background }]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {period === 'CUSTOM' && (
              <View style={styles.customDateRow}>
                <TouchableOpacity
                  style={[styles.dateBtn, { flex: 1 }]}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={14} color={colors.primary} />
                  <Text style={styles.dateBtnText}>{format(startDate, 'd MMM yy')}</Text>
                </TouchableOpacity>
                <Ionicons name="arrow-forward" size={12} color={colors.textMuted} />
                <TouchableOpacity
                  style={[styles.dateBtn, { flex: 1 }]}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={14} color={colors.primary} />
                  <Text style={styles.dateBtnText}>{format(endDate, 'd MMM yy')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Mode</Text>
            <View style={styles.optionsGrid}>
              {MODES.map((m) => (
                <TouchableOpacity
                  key={m.value}
                  style={[styles.optionCardHalf, mode === m.value && { borderColor: colors.text }]}
                  onPress={() => setMode(m.value)}
                >
                  <View style={styles.optionHeader}>
                    <Text style={[styles.optionTitle, mode === m.value && { color: colors.text }]}>{m.label}</Text>
                    {mode === m.value && <Ionicons name="checkmark-circle" size={16} color={colors.text} />}
                  </View>
                  <Text style={styles.optionDesc}>{m.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Scope</Text>
            <View style={styles.optionsGrid}>
              {SCOPES.map((s) => (
                <TouchableOpacity
                  key={s.value}
                  style={[styles.optionCardHalf, scope === s.value && { borderColor: colors.text }]}
                  onPress={() => setScope(s.value)}
                >
                  <View style={styles.optionHeader}>
                    <Text style={[styles.optionTitle, scope === s.value && { color: colors.text }]}>{s.label}</Text>
                    {scope === s.value && <Ionicons name="checkmark-circle" size={16} color={colors.text} />}
                  </View>
                  <Text style={styles.optionDesc}>{s.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {scope === 'OVERALL' ? 'Excluded categories' : 'Included categories'}
            </Text>
            <View style={styles.categoriesWrap}>
              {categories.map(cat => {
                const isSelected = selectedCategories.includes(cat.id);
                const catColor = toHexColor(cat.color);
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.catChip,
                      { borderColor: colors.border },
                      isSelected && { backgroundColor: catColor, borderColor: catColor }
                    ]}
                    onPress={() => toggleCategory(cat.id)}
                  >
                    <Ionicons
                      name={resolveIcon(cat.icon, 'pricetag-outline')}
                      size={14}
                      color={isSelected ? colors.background : catColor}
                    />
                    <Text style={[styles.catChipText, isSelected && { color: colors.background }]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {categories.length === 0 && (
                <Text style={styles.emptyText}>No expense categories found.</Text>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Accounts (optional)</Text>
            <View style={styles.categoriesWrap}>
              {accounts.map(acc => {
                const isSelected = selectedAccounts.includes(acc.id);
                const accColor = toHexColor(acc.color);
                return (
                  <TouchableOpacity
                    key={acc.id}
                    style={[
                      styles.catChip,
                      { borderColor: colors.border },
                      isSelected && { backgroundColor: accColor, borderColor: accColor }
                    ]}
                    onPress={() => toggleAccount(acc.id)}
                  >
                    <Ionicons
                      name={resolveIcon(acc.icon, 'wallet-outline')}
                      size={14}
                      color={isSelected ? colors.background : accColor}
                    />
                    <Text style={[styles.catChipText, isSelected && { color: colors.background }]}>
                      {acc.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {accounts.length === 0 && (
                <Text style={styles.emptyText}>No accounts found.</Text>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Color</Text>
            <View style={styles.colorRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorWrap}>
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
            <Text style={styles.sectionLabel}>Advanced</Text>
            <TouchableOpacity
              style={[styles.optionCard, isRolling && { borderColor: colors.text }]}
              onPress={() => setIsRolling(!isRolling)}
              activeOpacity={0.7}
            >
              <View style={styles.optionHeader}>
                <Text style={[styles.optionTitle, isRolling && { color: colors.text }]}>Rolling budget</Text>
                <Ionicons
                  name={isRolling ? "checkbox" : "square-outline"}
                  size={20}
                  color={isRolling ? colors.text : colors.textMuted}
                />
              </View>
              <Text style={styles.optionDesc}>Carry forward unused or overspent amounts from previous periods.</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, !canSubmit && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!canSubmit}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <Text style={styles.saveBtnText}>{isEditMode ? 'Save changes' : 'Save budget'}</Text>
          )}
        </TouchableOpacity>
      </View>
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowStartDatePicker(Platform.OS === 'ios');
            if (date) setStartDate(date);
          }}
        />
      )}
      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowEndDatePicker(Platform.OS === 'ios');
            if (date) setEndDate(date);
          }}
        />
      )}
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
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 10,
      color: theme.colors.textMuted,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    inputContainer: {
      height: 48,
      borderRadius: theme.radius.xl,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 16,
      justifyContent: 'center',
    },
    textInput: {
      fontFamily: theme.fontFamilies.sansMedium,
      fontSize: 15,
      color: theme.colors.text,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    gridBtn: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    gridBtnText: {
      fontFamily: theme.fontFamilies.sansMedium,
      fontSize: 13,
      color: theme.colors.text,
    },
    optionsList: {
      gap: 12,
    },
    optionsGrid: {
      flexDirection: 'row',
      gap: 12,
    },
    optionCard: {
      borderRadius: theme.radius.xl,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 16,
    },
    optionCardHalf: {
      flex: 1,
      borderRadius: theme.radius.xl,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 16,
    },
    optionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    optionTitle: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 14,
      color: theme.colors.textMuted,
    },
    optionDesc: {
      fontFamily: theme.fontFamilies.sans,
      fontSize: 11,
      color: theme.colors.textMuted,
      lineHeight: 16,
    },
    categoriesWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    catChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    catChipText: {
      fontFamily: theme.fontFamilies.sansMedium,
      fontSize: 13,
      color: theme.colors.text,
    },
    emptyText: {
      fontFamily: theme.fontFamilies.sans,
      fontSize: 14,
      color: theme.colors.textMuted,
    },
    colorRow: {
      marginHorizontal: -24,
    },
    colorWrap: {
      paddingHorizontal: 24,
    },
    colorCell: {
      width: 44,
      height: 44,
      borderRadius: theme.radius.full,
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    colorCellActive: {
      borderColor: theme.colors.text,
    },
    footer: {
      position: 'absolute',
      bottom: 34,
      left: 24,
      right: 24,
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
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 16,
      color: theme.colors.onPrimary,
    },
    customDateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
    },
    dateBtn: {
      height: 40,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    dateBtnText: {
      fontFamily: theme.fontFamilies.sansMedium,
      fontSize: 12,
      color: theme.colors.text,
    },
  });
