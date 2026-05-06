import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Header, IconPickerDialog, Input, PersonPickerDialog, SectionLabel } from '../../../components/ui';
import { CATEGORY_COLORS } from '../../../constants/picker';
import { LoanStatus, LoanType } from '../../../db/schema';
import { useSettings } from '../../../providers/SettingsProvider';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { parseAmount, toDbColor } from '../../../utils/format';
import { resolveIcon } from '../../../utils/icons';
import { useAccounts } from '../../accounts/hooks/accounts';
import { useCreateLoan, useLoanById, useUpdateLoan } from '../api/loans';

type Props = {
  mode: 'create' | 'edit';
  loanId?: number | null;
};

export const LoanFormPage = React.memo(function LoanFormPage({ mode, loanId }: Props) {
  const router = useRouter();
  const theme = useTheme();
  const { colors } = theme;
  const { profile } = useSettings();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const isEditMode = mode === 'edit';
  const { data: editingLoan, isLoading: loadingLoan } = useLoanById(isEditMode ? loanId ?? null : null);
  const { data: accountsList } = useAccounts();
  const { mutateAsync: createLoan, isPending: creating } = useCreateLoan();
  const { mutateAsync: updateLoan, isPending: updating } = useUpdateLoan();

  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [loanType, setLoanType] = useState<LoanType>('BORROW');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [accountId, setAccountId] = useState<number | null>(null);
  const [currency, setCurrency] = useState(profile.defaultCurrency);
  const [colorHex, setColorHex] = useState<string>(CATEGORY_COLORS[0]);
  const [iconKey, setIconKey] = useState('cash-outline');
  const [status, setStatus] = useState<LoanStatus>('ACTIVE');
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showPersonPicker, setShowPersonPicker] = useState(false);

  useEffect(() => {
    if (isEditMode && editingLoan) {
      setName(editingLoan.name);
      setTotalAmount(String(editingLoan.totalAmount));
      setLoanType(editingLoan.type);
      setStartDate(editingLoan.startDate ? new Date(editingLoan.startDate) : new Date());
      setEndDate(editingLoan.endDate ? new Date(editingLoan.endDate) : null);
      setAccountId(editingLoan.accountId);
      setSelectedPersonId(editingLoan.personId);
      setIconKey(editingLoan.icon + '-outline');
      setStatus(editingLoan.status);
    }
  }, [isEditMode, editingLoan]);

  const handleSave = useCallback(async () => {
    if (!name.trim() || !totalAmount) {
      Alert.alert('Missing info', 'Please provide a name and amount.');
      return;
    }

    const payload = {
      name: name.trim(),
      totalAmount: parseAmount(totalAmount),
      remainingAmount: parseAmount(totalAmount),
      type: loanType,
      startDate: startDate.toISOString(),
      endDate: endDate?.toISOString() || null,
      accountId,
      personId: selectedPersonId,
      icon: iconKey.replace('-outline', ''),
      color: toDbColor(colorHex),
      status,
    };

    try {
      if (isEditMode && loanId) {
        await updateLoan({ id: loanId, data: payload });
      } else {
        await createLoan(payload);
      }
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to save loan. Please try again.');
    }
  }, [name, totalAmount, loanType, startDate, endDate, accountId, selectedPersonId, iconKey, colorHex, status, isEditMode, loanId, createLoan, updateLoan, router]);

  const onStartDateChange = useCallback((_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) setStartDate(selectedDate);
  }, []);

  const onEndDateChange = useCallback((_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) setEndDate(selectedDate);
  }, []);

  const isSubmitting = creating || updating;
  const canSubmit = !!name.trim() && !!totalAmount && !isSubmitting;

  if (isEditMode && loadingLoan) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title={isEditMode ? 'Edit loan' : 'New loan'} showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formBody}>

          <View style={styles.section}>
            <SectionLabel size="sm" text="Loan name" />
            <Input
              value={name}
              onChangeText={setName}
              placeholder="e.g. Loan from Mom, Bank Loan"
              autoFocus={!isEditMode}
            />
          </View>

          <View style={styles.section}>
            <SectionLabel size="sm" text="Total amount" />
            <View style={styles.amountRow}>
              <Text style={styles.currencyLabel}>{currency}</Text>
              <Input
                value={totalAmount}
                onChangeText={setTotalAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
                style={styles.amountInput}
              />
            </View>
          </View>

          <View style={styles.section}>
            <SectionLabel size="sm" text="Loan type" />
            <View style={styles.chipRow}>
              {(['BORROW', 'LEND'] as LoanType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeChip,
                    loanType === t && {
                      backgroundColor: t === 'BORROW' ? colors.danger : colors.success,
                      borderColor: 'transparent',
                    },
                  ]}
                  onPress={() => setLoanType(t)}
                >
                  <Text style={[styles.typeChipText, { color: loanType === t ? '#FFF' : colors.textMuted }]}>
                    {t === 'BORROW' ? 'Borrowing' : 'Lending'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <SectionLabel size="sm" text="Linked account" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {accountsList?.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={[
                    styles.chip,
                    accountId === account.id && { backgroundColor: colors.text, borderColor: colors.text },
                  ]}
                  onPress={() => {
                    setAccountId(account.id);
                    setCurrency(account.currency);
                  }}
                >
                  <Text style={[styles.chipText, { color: accountId === account.id ? colors.background : colors.text }]}>
                    {account.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.row}>
            <View style={[styles.section, { flex: 1 }]}>
              <SectionLabel size="sm" text="Start date" />
              <TouchableOpacity
                style={styles.dateBtn}
                onPress={() => setShowStartDatePicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                <Text style={styles.dateBtnText}>{format(startDate, 'd MMM yy')}</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.section, { flex: 1 }]}>
              <SectionLabel size="sm" text="End date" />
              <TouchableOpacity
                style={styles.dateBtn}
                onPress={() => setShowEndDatePicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                <Text style={styles.dateBtnText}>
                  {endDate ? format(endDate, 'd MMM yy') : 'Optional'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

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
            <SectionLabel size="sm" text="Icon" />
            <TouchableOpacity
              style={styles.iconSelectorBtn}
              onPress={() => setShowIconPicker(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconPreview, { backgroundColor: colorHex + '15' }]}>
                <Ionicons name={resolveIcon(iconKey, 'cash-outline')} size={18} color={colorHex} />
              </View>
              <Text style={styles.iconSelectorText}>
                {iconKey.replace('-outline', '').replace(/-/g, ' ')}
              </Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <SectionLabel size="sm" text="Color" />
            <View style={styles.colorRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorWrap}>
                {CATEGORY_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    activeOpacity={0.8}
                    onPress={() => setColorHex(c)}
                    style={[styles.colorCell, { backgroundColor: c }, colorHex === c && styles.colorCellActive]}
                  >
                    {colorHex === c ? <Ionicons name="checkmark" size={14} color="#000" /> : null}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {isEditMode && (
            <View style={styles.section}>
              <SectionLabel size="sm" text="Status" />
              <View style={styles.chipRow}>
                {(['ACTIVE', 'PAID', 'OVERDUE'] as LoanStatus[]).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.chip,
                      status === s && { backgroundColor: colors.text, borderColor: colors.text },
                    ]}
                    onPress={() => setStatus(s)}
                  >
                    <Text style={[styles.chipText, { color: status === s ? colors.background : colors.textMuted }]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.saveBtn, !canSubmit && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!canSubmit}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <Text style={styles.saveBtnText}>
              {isEditMode ? 'Update loan' : 'Create loan'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={onStartDateChange}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display="default"
          onChange={onEndDateChange}
        />
      )}

      <IconPickerDialog
        visible={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        selectedIcon={iconKey}
        onSelect={setIconKey}
        title="Loan icon"
      />

      <PersonPickerDialog
        visible={showPersonPicker}
        onClose={() => setShowPersonPicker(false)}
        selectedId={selectedPersonId}
        onSelect={setSelectedPersonId}
        onAddPerson={() => router.push('/people/create')}
      />
    </SafeAreaView>
  );
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
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: theme.spacing[24],
    paddingBottom: 120,
  },
  formBody: {
    gap: theme.spacing[24],
  },
  section: {
    gap: theme.spacing[12],
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing[16],
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[12],
  },
  currencyLabel: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 20,
    color: theme.colors.textMuted,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontFamily: theme.fontFamilies.sansBold,
  },
  chipRow: {
    flexDirection: 'row',
    gap: theme.spacing[8],
  },
  chip: {
    paddingHorizontal: theme.spacing[16],
    paddingVertical: theme.spacing[8],
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing[8],
    backgroundColor: theme.colors.surface,
  },
  chipText: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 13,
  },
  typeChip: {
    flex: 1,
    height: 44,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  typeChipText: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 13,
  },
  dateBtn: {
    height: 40,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[8],
  },
  dateBtnText: {
    fontFamily: theme.fontFamilies.sansMedium,
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
  iconSelectorBtn: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[12],
    paddingHorizontal: theme.spacing[16],
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  iconPreview: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconSelectorText: {
    flex: 1,
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 14,
    color: theme.colors.text,
    textTransform: 'capitalize',
  },
  colorRow: {
    marginHorizontal: -theme.layout.screenPadding,
  },
  colorWrap: {
    paddingHorizontal: theme.layout.screenPadding,
  },
  colorCell: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: theme.spacing[12],
  },
  colorCellActive: {
    borderColor: theme.colors.text,
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
    justifyContent: 'center',
    alignItems: 'center',
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
});
