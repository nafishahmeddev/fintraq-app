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
import { Button, Header, IconPickerDialog, Input, Typography } from '../../../components/ui';
import { CATEGORY_COLORS } from '../../../constants/picker';
import { GoalStatus } from '../../../db/schema';
import { useSettings } from '../../../providers/SettingsProvider';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { parseAmount, toDbColor } from '../../../utils/format';
import { useAccounts } from '../../accounts/hooks/accounts';
import { useCreateGoal, useGoalById, useUpdateGoal } from '../api/goals';

type Props = {
  mode: 'create' | 'edit';
  goalId?: number | null;
};

export const GoalFormPage = React.memo(function GoalFormPage({ mode, goalId }: Props) {
  const router = useRouter();
  const theme = useTheme();
  const { colors } = theme;
  const { profile } = useSettings();
  const styles = useMemo(() => createStyles(theme), [theme]);

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
  }, [name, targetAmount, startDate, endDate, accountId, iconKey, colorHex, status, isEditMode, goalId, createGoal, updateGoal, router]);

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
        title={isEditMode ? 'Edit goal' : 'New goal'}
        subtitle={isEditMode ? 'Update your target' : 'Set a new savings target'}
        showBack
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Typography variant="label">Goal name</Typography>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="e.g. New car, Travel fund"
            autoFocus={!isEditMode}
          />
        </View>

        <View style={styles.section}>
          <Typography variant="label">Target amount</Typography>
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
          <Typography variant="label">Visuals</Typography>
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
          title={isEditMode ? 'Update goal' : 'Create goal'}
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
        title="Goal icon"
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
    fontSize: 32,
    fontFamily: theme.fontFamilies.sansBold,
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
