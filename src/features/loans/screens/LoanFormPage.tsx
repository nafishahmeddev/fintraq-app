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
import { Button, Header, IconPickerDialog, Input, PersonPickerDialog, SectionLabel, Typography } from '../../../components/ui';
import { CATEGORY_COLORS } from '../../../constants/picker';
import { LoanStatus, LoanType } from '../../../db/schema';
import { useSettings } from '../../../providers/SettingsProvider';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { parseAmount, toDbColor } from '../../../utils/format';
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
  const [colorHex, setColorHex] = useState<string>(CATEGORY_COLORS[20]);
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
              <Typography variant="h3" color={colors.textMuted}>{currency}</Typography>
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
                  <Typography
                    variant="label"
                    color={loanType === t ? '#FFF' : colors.textMuted}
                  >
                    {t === 'BORROW' ? 'Borrowing' : 'Lending'}
                  </Typography>
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
                  <Typography
                    variant="label"
                    color={accountId === account.id ? colors.background : colors.text}
                  >
                    {account.name}
                  </Typography>
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
              <Typography
                variant="body"
                color={selectedPersonId ? colors.text : colors.textMuted}
                style={{ flex: 1 }}
              >
                {selectedPersonId ? 'Person linked' : 'Link a person'}
              </Typography>
              <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <SectionLabel size="sm" text="Appearance" />
            <View style={styles.visualsRow}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => setShowIconPicker(true)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconBox, { backgroundColor: colorHex + '15' }]}>
                  <Ionicons name={iconKey as any} size={24} color={colorHex} />
                </View>
                <Typography variant="bodySm" color={colors.textMuted}>Icon</Typography>
              </TouchableOpacity>

              <View style={styles.colorGrid}>
                {CATEGORY_COLORS.slice(10, 20).map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: color },
                      colorHex === color && styles.colorCircleActive,
                    ]}
                    onPress={() => setColorHex(color)}
                  >
                    {colorHex === color ? <Ionicons name="checkmark" size={14} color="#000" /> : null}
                  </TouchableOpacity>
                ))}
              </View>
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
                    <Typography
                      variant="label"
                      color={status === s ? colors.background : colors.textMuted}
                    >
                      {s}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={isEditMode ? 'Update loan' : 'Create loan'}
          onPress={handleSave}
          isLoading={isSubmitting}
          size="lg"
        />
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
    paddingTop: theme.spacing[16],
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
  visualsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[24],
    padding: theme.spacing[16],
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  iconBtn: {
    alignItems: 'center',
    gap: theme.spacing[8],
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  colorGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[8],
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircleActive: {
    borderColor: theme.colors.text,
  },
  footer: {
    position: 'absolute',
    bottom: 34,
    left: theme.layout.screenPadding,
    right: theme.layout.screenPadding,
  },
});
