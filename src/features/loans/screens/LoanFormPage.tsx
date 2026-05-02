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
import { Header, Input, Button, IconPickerDialog, PersonPickerDialog, Typography } from '../../../components/ui';
import { useSettings } from '../../../providers/SettingsProvider';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
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
    } catch (error) {
      Alert.alert('Error', 'Failed to save loan. Please try again.');
    }
  }, [name, totalAmount, loanType, startDate, endDate, accountId, selectedPersonId, iconKey, colorHex, status, isEditMode, loanId, createLoan, updateLoan, router]);

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
        title={isEditMode ? 'Edit loan' : 'New loan'} 
        subtitle={isEditMode ? 'Update debt details' : 'Track money lent or borrowed'} 
        showBack 
      />

      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Typography variant="label">Loan name</Typography>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="e.g. Loan from Mom, Bank Loan"
            autoFocus={!isEditMode}
          />
        </View>

        <View style={styles.section}>
          <Typography variant="label">Total amount</Typography>
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
          <Typography variant="label">Loan type</Typography>
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
          <Typography variant="label">Linked account</Typography>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountsRow}>
            {accountsList?.map((account) => (
              <TouchableOpacity
                key={account.id}
                style={[
                  styles.accountChip,
                  accountId === account.id && { backgroundColor: colors.text, borderColor: colors.text }
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
            <Typography variant="label">Start date</Typography>
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
            <Typography variant="label">End date</Typography>
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
          <Typography variant="label">Person (optional)</Typography>
          <TouchableOpacity 
            style={styles.pickerBtn} 
            onPress={() => setShowPersonPicker(true)}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <Ionicons name="person-outline" size={20} color={colors.primary} />
              <Typography variant="body" weight="sansBold" color={selectedPersonId ? colors.text : colors.textMuted}>
                {selectedPersonId ? 'Linked person' : 'Link person'}
              </Typography>
            </View>
            <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Typography variant="label">Appearance</Typography>
          <View style={styles.visualsRow}>
            <TouchableOpacity 
              style={styles.iconBtn} 
              onPress={() => setShowIconPicker(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: colorHex + '15' }]}>
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
                    status === s && { backgroundColor: colors.text, borderColor: colors.text }
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
          title={isEditMode ? 'Update loan' : 'Create loan'}
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
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 48,
    gap: 24,
  },
  section: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontFamily: theme.fontFamilies.sansBold,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeChip: {
    flex: 1,
    height: 48,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  pickerBtn: {
    height: 56,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    backgroundColor: theme.colors.surface,
  },
  visualsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  iconBtn: {
    alignItems: 'center',
    gap: 8,
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
    gap: 8,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.full,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  accountsRow: {
    paddingVertical: 8,
  },
  accountChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 8,
    backgroundColor: theme.colors.surface,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 8,
    backgroundColor: theme.colors.background,
  },
});
