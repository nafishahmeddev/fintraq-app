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
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, CurrencyPickerModal, Header, IconPickerDialog, Input, Typography } from '../../../components/ui';
import { CATEGORY_COLORS } from '../../../constants/picker';
import { GoalStatus } from '../../../db/schema';
import { useSettings } from '../../../providers/SettingsProvider';
import { useTheme } from '../../../providers/ThemeProvider';
import { ThemeColors } from '../../../theme/colors';
import { LAYOUT, radius, spacing } from '../../../theme/tokens';
import { TYPOGRAPHY } from '../../../theme/typography';
import { parseAmount, toDbColor } from '../../../utils/format';
import { useAccounts } from '../../accounts/hooks/accounts';
import { useCreateGoal, useGoalById, useUpdateGoal } from '../api/goals';

type Props = {
  mode: 'create' | 'edit';
  goalId?: number | null;
};

export const GoalFormPage = React.memo(function GoalFormPage({ mode, goalId }: Props) {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const isEditMode = mode === 'edit';
  const { data: editingGoal, isLoading: loadingGoal } = useGoalById(isEditMode ? goalId ?? null : null);
  const { mutateAsync: createGoal, isPending: creating } = useCreateGoal();
  const { mutateAsync: updateGoal, isPending: updating } = useUpdateGoal();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [accountId, setAccountId] = useState<number | null>(null);
  const [currency, setCurrency] = useState(profile.defaultCurrency);
  const [colorHex, setColorHex] = useState<string>(CATEGORY_COLORS[0]);
  const [iconKey, setIconKey] = useState('flag-outline');
  const [status, setStatus] = useState<GoalStatus>('ACTIVE');

  const { data: accountsList } = useAccounts();

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    if (isEditMode && editingGoal) {
      setName(editingGoal.name);
      setTargetAmount(String(editingGoal.targetAmount));
      setStartDate(editingGoal.startDate ? new Date(editingGoal.startDate) : new Date());
      setEndDate(editingGoal.endDate ? new Date(editingGoal.endDate) : null);
      setAccountId(editingGoal.accountId);
      // setCurrency will be handled by accountId effect or initial load
      setIconKey(editingGoal.icon + '-outline');
      setStatus(editingGoal.status);
    }
  }, [isEditMode, editingGoal]);

  const handleSave = useCallback(async () => {
    if (!name.trim() || !targetAmount) {
      Alert.alert('Missing info', 'Please provide a name and target amount.');
      return;
    }

    const payload = {
      name: name.trim(),
      targetAmount: parseAmount(targetAmount),
      startDate: startDate.toISOString(),
      endDate: endDate?.toISOString() || null,
      accountId,
      icon: iconKey.replace('-outline', ''),
      color: toDbColor(colorHex),
      status,
    };

    try {
      if (isEditMode && goalId) {
        await updateGoal({ id: goalId, data: payload });
      } else {
        await createGoal(payload);
      }
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save goal. Please try again.');
    }
  }, [name, targetAmount, currency, startDate, endDate, accountId, iconKey, colorHex, status, isEditMode, goalId, createGoal, updateGoal, router]);

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

  if (isEditMode && loadingGoal) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={isEditMode ? 'Edit Goal' : 'New Goal'}
        subtitle={isEditMode ? 'Update your target' : 'Set a new savings target'}
        showBack
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Typography variant="label">Goal Name</Typography>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="e.g. New Car, Travel Fund"
            autoFocus={!isEditMode}
          />
        </View>

        <View style={styles.section}>
          <Typography variant="label">Target Amount</Typography>
          <View style={styles.amountContainer}>
            <Typography variant="h2" color={colors.textMuted}>{currency}</Typography>
            <Input
              value={targetAmount}
              onChangeText={setTargetAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              style={styles.amountInput}
            />
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
          <Typography variant="label">Visuals</Typography>
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
              {CATEGORY_COLORS.slice(0, 10).map((color) => (
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
              {(['ACTIVE', 'PAUSED', 'REACHED'] as GoalStatus[]).map((s) => (
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
          title={isEditMode ? 'Update Goal' : 'Create Goal'}
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
        title="Goal Icon"
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
    fontSize: 32,
    fontFamily: TYPOGRAPHY.fonts.bold,
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
