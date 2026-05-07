import { CurrencyPickerModal } from '../../../components/ui/CurrencyPickerModal';
import { Header } from '../../../components/ui/Header';
import { IconPickerDialog } from '../../../components/ui/IconPickerDialog';
import { Input } from '../../../components/ui/Input';
import { SectionLabel } from '../../../components/ui/SectionLabel';
import { ACCOUNT_COLORS } from '../../../constants/picker';
import { ACCOUNT_TYPES, AccountType } from '../../../db/schema';
import { useAccountById, useCreateAccount, useUpdateAccount } from '../hooks/accounts';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { parseAmount, toDbColor } from '../../../utils/format';
import { IoniconName, resolveIcon } from '../../../utils/icons';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  mode: 'create' | 'edit';
  accountId?: number;
};

type AccountFormValues = {
  name: string;
  holderName: string;
  accountNumber: string;
  balance: string;
};

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: 'Cash',
  card: 'Card',
  savings: 'Savings',
};

const ACCOUNT_TYPE_ICONS: Record<AccountType, IoniconName> = {
  cash: 'cash-outline',
  card: 'card-outline',
  savings: 'save-outline',
};

export const AccountFormPage = React.memo(function AccountFormPage({ mode, accountId }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isEdit = mode === 'edit';

  const { data: account, isLoading } = useAccountById(isEdit ? (accountId ?? null) : null);
  const { mutateAsync: createAccount, isPending: isCreating } = useCreateAccount();
  const { mutateAsync: updateAccount, isPending: isUpdating } = useUpdateAccount();
  const isPending = isCreating || isUpdating;

  const [currency, setCurrency] = useState<string>('USD');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [colorHex, setColorHex] = useState<string>(ACCOUNT_COLORS[0]);
  const [iconKey, setIconKey] = useState<string>('wallet-outline');
  const [accountType, setAccountType] = useState<AccountType>('cash');
  const [showIconPicker, setShowIconPicker] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isValid },
  } = useForm<AccountFormValues>({
    mode: 'onChange',
    defaultValues: { name: '', holderName: '', accountNumber: '', balance: '' },
  });

  useEffect(() => {
    if (account) {
      reset({
        name: account.name,
        holderName: account.holderName,
        accountNumber: account.accountNumber ?? '',
        balance: '',
      });
      setCurrency(account.currency);
      setColorHex(`#${account.color.toString(16).padStart(6, '0').toUpperCase()}`);
      setIconKey(account.icon ? `${account.icon}-outline` : 'wallet-outline');
      setAccountType(account.type);
    }
  }, [account, reset]);

  const openCurrencyPicker = useCallback(() => setShowCurrencyPicker(true), []);
  const closeCurrencyPicker = useCallback(() => setShowCurrencyPicker(false), []);
  const openIconPicker = useCallback(() => setShowIconPicker(true), []);
  const closeIconPicker = useCallback(() => setShowIconPicker(false), []);

  const handleSave = handleSubmit(async (data) => {
    try {
      if (isEdit && accountId) {
        await updateAccount({
          id: accountId,
          data: {
            name: data.name.trim(),
            holderName: data.holderName.trim(),
            accountNumber: data.accountNumber.trim() || null,
            type: accountType,
            currency,
            color: toDbColor(colorHex),
            icon: iconKey.replace('-outline', ''),
          },
        });
      } else {
        await createAccount({
          name: data.name.trim(),
          holderName: data.holderName.trim(),
          accountNumber: data.accountNumber.trim() || null,
          type: accountType,
          balance: parseAmount(data.balance),
          currency,
          color: toDbColor(colorHex),
          icon: iconKey.replace('-outline', ''),
        });
      }
      router.back();
    } catch {
      Alert.alert('Error', isEdit ? 'Failed to update account.' : 'Failed to create account.');
    }
  });

  if (isEdit && isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title={isEdit ? 'Edit account' : 'New account'} showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formBody}>

          <View style={styles.section}>
            <SectionLabel size="sm" text="Account name" />
            <Controller
              control={control}
              name="name"
              rules={{ required: true }}
              render={({ field }) => (
                <Input
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="e.g. Daily Spending"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              )}
            />
          </View>

          <View style={styles.section}>
            <SectionLabel size="sm" text="Account type" />
            <View style={styles.chipGrid}>
              {ACCOUNT_TYPES.map((type: AccountType) => {
                const isSelected = accountType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    activeOpacity={0.7}
                    onPress={() => setAccountType(type)}
                    style={[
                      styles.chip,
                      isSelected && { backgroundColor: colorHex, borderColor: colorHex },
                    ]}
                  >
                    <Ionicons
                      name={ACCOUNT_TYPE_ICONS[type]}
                      size={14}
                      color={isSelected ? colors.background : colors.text}
                    />
                    <Text style={[styles.chipText, { color: isSelected ? colors.background : colors.text }]}>
                      {ACCOUNT_TYPE_LABELS[type]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {!isEdit && (
            <View style={styles.section}>
              <SectionLabel size="sm" text="Opening balance" />
              <View style={styles.balanceRow}>
                <TouchableOpacity style={styles.currencyBtn} onPress={openCurrencyPicker} activeOpacity={0.7}>
                  <Text style={styles.currencyText}>{currency}</Text>
                </TouchableOpacity>
                <View style={styles.balanceInputWrap}>
                  <Controller
                    control={control}
                    name="balance"
                    rules={{
                      validate: (v) =>
                        !v.trim() || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0) || 'Enter a valid amount',
                    }}
                    render={({ field }) => (
                      <Input
                        value={field.value}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                        style={styles.balanceInputText}
                      />
                    )}
                  />
                </View>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <SectionLabel size="sm" text={isEdit ? 'Icon & currency' : 'Icon'} />
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.iconSelectorBtn, { flex: 1 }]}
                onPress={openIconPicker}
                activeOpacity={0.7}
              >
                <View style={[styles.iconPreview, { backgroundColor: colorHex + '15' }]}>
                  <Ionicons name={resolveIcon(iconKey, 'wallet-outline')} size={18} color={colorHex} />
                </View>
                <Text style={styles.iconSelectorText}>
                  {iconKey.replace('-outline', '').replace(/-/g, ' ')}
                </Text>
                {!isEdit && <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />}
              </TouchableOpacity>

              {isEdit && (
                <TouchableOpacity
                  style={[styles.iconSelectorBtn, { flex: 1 }]}
                  onPress={openCurrencyPicker}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconPreview}>
                    <Text style={styles.currencyInitial}>{currency}</Text>
                  </View>
                  <Text style={styles.iconSelectorText}>Currency</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <SectionLabel size="sm" text="Color" />
            <View style={styles.colorRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorWrap}>
                {ACCOUNT_COLORS.map((item: string) => (
                  <TouchableOpacity
                    key={item}
                    activeOpacity={0.8}
                    onPress={() => setColorHex(item)}
                    style={[
                      styles.colorCell,
                      { backgroundColor: item },
                      colorHex === item && styles.colorCellActive,
                    ]}
                  >
                    {colorHex === item ? <Ionicons name="checkmark" size={14} color="#000" /> : null}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.section}>
            <SectionLabel size="sm" text="Extended details (optional)" />
            <Controller
              control={control}
              name="holderName"
              render={({ field }) => (
                <Input
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Holder name"
                />
              )}
            />
            <Controller
              control={control}
              name="accountNumber"
              render={({ field }) => (
                <Input
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Account number / IBAN"
                />
              )}
            />
          </View>

        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.saveBtn, (!isValid || isPending) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!isValid || isPending}
        >
          <Text style={styles.saveBtnText}>
            {isPending
              ? (isEdit ? 'Saving...' : 'Creating...')
              : (isEdit ? 'Save changes' : 'Create account')}
          </Text>
        </TouchableOpacity>
      </View>

      <CurrencyPickerModal
        visible={showCurrencyPicker}
        onClose={closeCurrencyPicker}
        value={currency}
        onChange={(code: string) => setCurrency(code)}
      />

      <IconPickerDialog
        visible={showIconPicker}
        onClose={closeIconPicker}
        selectedIcon={iconKey}
        onSelect={setIconKey}
        title="Account icon"
      />
    </SafeAreaView>
  );
});

const createStyles = (theme: Theme) =>
  StyleSheet.create({
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
      gap: theme.spacing[12],
    },
    chipGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing[8],
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[8],
      height: 40,
      paddingHorizontal: theme.spacing[16],
      paddingVertical: theme.spacing[8],
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    chipText: {
      fontFamily: theme.fontFamilies.sansMedium,
      fontSize: 13,
    },
    balanceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[12],
    },
    currencyBtn: {
      height: 48,
      paddingHorizontal: theme.spacing[16],
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    currencyText: {
      fontFamily: theme.fontFamilies.sansBold,
      fontSize: 14,
      color: theme.colors.textMuted,
    },
    balanceInputWrap: {
      flex: 1,
    },
    balanceInputText: {
      fontFamily: theme.fontFamilies.monoBold,
      fontSize: 20,
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
      backgroundColor: theme.colors.background,
    },
    iconSelectorText: {
      flex: 1,
      fontFamily: theme.fontFamilies.sansMedium,
      fontSize: 14,
      color: theme.colors.text,
      textTransform: 'capitalize',
    },
    currencyInitial: {
      fontFamily: theme.fontFamilies.sansBold,
      fontSize: 12,
      color: theme.colors.textMuted,
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
