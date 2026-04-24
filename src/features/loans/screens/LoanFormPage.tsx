import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, Input, Button, IconPickerDialog, Typography } from '../../../components/ui';
import { useTheme } from '../../../providers/ThemeProvider';
import { useSettings } from '../../../providers/SettingsProvider';
import { ThemeColors } from '../../../theme/colors';
import { spacing, LAYOUT, radius } from '../../../theme/tokens';
import { TYPOGRAPHY } from '../../../theme/typography';
import { CATEGORY_COLORS } from '../../../constants/picker';
import { toDbColor, parseAmount } from '../../../utils/format';
import { useCreateLoan, useUpdateLoan, useLoanById } from '../api/loans';
import { useAccounts } from '../../accounts/hooks/accounts';
import { LoanType, LoanStatus } from '../../../db/schema';

type Props = {
  mode: 'create' | 'edit';
  loanId?: number | null;
};

export const LoanFormPage = React.memo(function LoanFormPage({ mode, loanId }: Props) {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

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

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);

  useEffect(() => {
    if (isEditMode && editingLoan) {
      setName(editingLoan.name);
      setTotalAmount(String(editingLoan.totalAmount));
      setLoanType(editingLoan.type);
      setStartDate(editingLoan.startDate ? new Date(editingLoan.startDate) : new Date());
      setEndDate(editingLoan.endDate ? new Date(editingLoan.endDate) : null);
      setAccountId(editingLoan.accountId);
      // Currency will be updated by accounts list or setAccountId effect
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
    } catch (error) {
      Alert.alert('Error', 'Failed to save loan. Please try again.');
    }
  }, [name, totalAmount, loanType, startDate, endDate, accountId, iconKey, colorHex, status, isEditMode, loanId, createLoan, updateLoan, router]);

  const onStartDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const onEndDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

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
      <Header 
        title={isEditMode ? 'Edit Loan' : 'New Loan'} 
        subtitle={isEditMode ? 'Update debt details' : 'Track money lent or borrowed'} 
        showBack 
      />

      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Typography variant="label">Loan Name</Typography>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="e.g. Loan from Mom, Bank Loan"
            autoFocus={!isEditMode}
          />
        </View>

        <View style={styles.section}>
          <Typography variant="label">Total Amount</Typography>
          <View style={styles.amountContainer}>
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
          <Typography variant="label">Loan Type</Typography>
          <View style={styles.typeRow}>
            {(['BORROW', 'LEND'] as LoanType[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.typeChip,
                  loanType === t && { backgroundColor: t === 'BORROW' ? colors.danger : colors.success, borderColor: 'transparent' }
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
          <Typography variant="label">Linked Account</Typography>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountsRow}>
            {accountsList?.map((account) => (
              <TouchableOpacity
                key={account.id}
                style={[
                  styles.accountChip,
                  accountId === account.id && { backgroundColor: colors.primary, borderColor: colors.primary }
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
            <Typography variant="label">Start Date</Typography>
            <TouchableOpacity 
              style={styles.pickerBtn} 
              onPress={() => setShowStartDatePicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Typography variant="body">
                {format(startDate, 'MMM d, yyyy')}
              </Typography>
            </TouchableOpacity>
          </View>

          <View style={[styles.section, { flex: 1 }]}>
            <Typography variant="label">End Date</Typography>
            <TouchableOpacity 
              style={styles.pickerBtn} 
              onPress={() => setShowEndDatePicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Typography variant="body">
                {endDate ? format(endDate, 'MMM d, yyyy') : 'Optional'}
              </Typography>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Typography variant="label">Appearance</Typography>
          <View style={styles.visualsRow}>
            <TouchableOpacity 
              style={styles.iconBtn} 
              onPress={() => setShowIconPicker(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: colorHex + '20' }]}>
                <Ionicons name={iconKey as any} size={24} color={colorHex} />
              </View>
              <Typography variant="bodySm">Icon</Typography>
            </TouchableOpacity>

            <View style={styles.colorGrid}>
              {CATEGORY_COLORS.slice(10, 20).map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: color },
                    colorHex === color && { borderColor: colors.text, borderWidth: 2 }
                  ]}
                  onPress={() => setColorHex(color)}
                />
              ))}
            </View>
          </View>
        </View>

        {isEditMode && (
          <View style={styles.section}>
            <Typography variant="label">Status</Typography>
            <View style={styles.statusRow}>
              {(['ACTIVE', 'PAID', 'OVERDUE'] as LoanStatus[]).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.statusChip,
                    status === s && { backgroundColor: colors.primary, borderColor: colors.primary }
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
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={isEditMode ? 'Update Loan' : 'Create Loan'}
          onPress={handleSave}
          isLoading={isSubmitting}
          shadow="none"
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
        title="Loan Icon"
      />
    </SafeAreaView>
  );
});

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingTop: spacing('4'),
    paddingBottom: spacing('12'),
    gap: spacing('6'),
  },
  section: {
    gap: spacing('2'),
  },
  row: {
    flexDirection: 'row',
    gap: spacing('4'),
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('3'),
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontFamily: TYPOGRAPHY.fonts.bold,
  },
  rateInput: {
    fontSize: 24,
    fontFamily: TYPOGRAPHY.fonts.bold,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing('2'),
  },
  typeChip: {
    flex: 1,
    height: 48,
    borderRadius: radius('md'),
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  pickerBtn: {
    height: 56,
    borderRadius: radius('lg'),
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing('4'),
    gap: spacing('3'),
    backgroundColor: colors.surface,
  },
  visualsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('6'),
    padding: spacing('4'),
    backgroundColor: colors.surface,
    borderRadius: radius('lg'),
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBtn: {
    alignItems: 'center',
    gap: spacing('2'),
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: radius('md'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing('2'),
  },
  colorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing('2'),
  },
  statusChip: {
    paddingHorizontal: spacing('4'),
    paddingVertical: spacing('2'),
    borderRadius: radius('full'),
    borderWidth: 1,
    borderColor: colors.border,
  },
  accountsRow: {
    paddingVertical: spacing('2'),
  },
  accountChip: {
    paddingHorizontal: spacing('4'),
    paddingVertical: spacing('2'),
    borderRadius: radius('full'),
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing('2'),
    backgroundColor: colors.surface,
  },
  footer: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingBottom: spacing('6'),
    paddingTop: spacing('2'),
    backgroundColor: colors.background,
  },
});
