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
import { Header, IconPickerDialog, Input, SectionLabel } from '../../../components/ui';
import { CATEGORY_COLORS } from '../../../constants/picker';
import { GoalStatus } from '../../../db/schema';
import { useSettings } from '../../../providers/SettingsProvider';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { parseAmount, toDbColor } from '../../../utils/format';
import { resolveIcon } from '../../../utils/icons';
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
    } catch {
      Alert.alert('Error', 'Failed to save goal. Please try again.');
    }
  }, [name, targetAmount, startDate, endDate, accountId, iconKey, colorHex, status, isEditMode, goalId, createGoal, updateGoal, router]);

  const onStartDateChange = useCallback((_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) setStartDate(selectedDate);
  }, []);

  const onEndDateChange = useCallback((_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) setEndDate(selectedDate);
  }, []);

  const isSubmitting = creating || updating;
  const canSubmit = !!name.trim() && !!targetAmount && !isSubmitting;

  if (isEditMode && loadingGoal) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title={isEditMode ? 'Edit goal' : 'New goal'} showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formBody}>

          <View style={styles.section}>
            <SectionLabel size="sm" text="Goal name" />
            <Input
              value={name}
              onChangeText={setName}
              placeholder="e.g. New car, Travel fund"
              autoFocus={!isEditMode}
            />
          </View>

          <View style={styles.section}>
            <SectionLabel size="sm" text="Target amount" />
            <View style={styles.amountRow}>
              <Text style={styles.currencyLabel}>{currency}</Text>
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
            <SectionLabel size="sm" text="Icon" />
            <TouchableOpacity
              style={styles.iconSelectorBtn}
              onPress={() => setShowIconPicker(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconPreview, { backgroundColor: colorHex + '15' }]}>
                <Ionicons name={resolveIcon(iconKey, 'flag-outline')} size={18} color={colorHex} />
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
                {(['ACTIVE', 'PAUSED', 'REACHED'] as GoalStatus[]).map((s) => (
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
              {isEditMode ? 'Update goal' : 'Create goal'}
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
  chipRow: {
    flexDirection: 'row',
    gap: theme.spacing[8],
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
