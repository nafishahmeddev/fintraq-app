import { CurrencyPickerModal } from '@/src/components/ui/CurrencyPickerModal';
import { Header } from '@/src/components/ui/Header';
import { IconPickerDialog } from '@/src/components/ui/IconPickerDialog';
import { Input } from '@/src/components/ui/Input';
import { SectionLabel } from '@/src/components/ui/SectionLabel';
import { ACCOUNT_COLORS } from '@/src/constants/picker';
import { ACCOUNT_TYPES, AccountType } from '@/src/db/schema';
import { useCreateAccount } from '@/src/features/accounts/hooks/accounts';
import { Theme, useTheme } from '@/src/providers/ThemeProvider';
import { parseAmount, toDbColor } from '@/src/utils/format';
import { resolveIcon } from '@/src/utils/icons';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  investment: 'Investment',
  loan: 'Loan',
  other: 'Other',
};

const ACCOUNT_TYPE_ICONS: Record<AccountType, string> = {
  cash: 'cash-outline',
  card: 'card-outline',
  savings: 'save-outline',
  investment: 'trending-up-outline',
  loan: 'receipt-outline',
  other: 'folder-outline',
};

export default function AccountCreatePage() {
  const theme = useTheme();
  const { colors } = theme;
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { mutateAsync: createAccount, isPending } = useCreateAccount();

  const [currency, setCurrency] = useState<string>('USD');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [colorHex, setColorHex] = useState<string>(ACCOUNT_COLORS[0]);
  const [iconKey, setIconKey] = useState<string>('wallet-outline');
  const [accountType, setAccountType] = useState<AccountType>('cash');
  const [showIconPicker, setShowIconPicker] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { isValid },
  } = useForm<AccountFormValues>({
    mode: 'onChange',
    defaultValues: { name: '', holderName: '', accountNumber: '', balance: '' },
  });

  const handleSave = handleSubmit(async (data) => {
    const payload = {
      name: data.name.trim(),
      holderName: data.holderName.trim(),
      accountNumber: data.accountNumber.trim() || null,
      type: accountType,
      balance: parseAmount(data.balance),
      currency,
      color: toDbColor(colorHex),
      icon: iconKey.replace('-outline', ''),
    };

    try {
      await createAccount(payload);
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to create account. Please try again.');
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      <Header title="New account" showBack />

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
                      name={ACCOUNT_TYPE_ICONS[type] as any}
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

          <View style={styles.section}>
            <SectionLabel size="sm" text="Opening balance" />
            <View style={styles.balanceRow}>
              <TouchableOpacity
                style={styles.currencyBtn}
                onPress={() => setShowCurrencyPicker(true)}
                activeOpacity={0.7}
              >
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

          <View style={styles.section}>
            <SectionLabel size="sm" text="Icon" />
            <TouchableOpacity
              style={styles.iconSelectorBtn}
              onPress={() => setShowIconPicker(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconPreview, { backgroundColor: colorHex + '15' }]}>
                <Ionicons name={resolveIcon(iconKey, 'wallet-outline')} size={18} color={colorHex} />
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
            {isPending ? 'Creating...' : 'Create account'}
          </Text>
        </TouchableOpacity>
      </View>

      <CurrencyPickerModal
        visible={showCurrencyPicker}
        onClose={() => setShowCurrencyPicker(false)}
        value={currency}
        onChange={(code: string) => setCurrency(code)}
      />

      <IconPickerDialog
        visible={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        selectedIcon={iconKey}
        onSelect={setIconKey}
        title="Account icon"
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
    chipGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing[8],
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[8],
      paddingHorizontal: theme.spacing[16],
      paddingVertical: theme.spacing[8],
      borderRadius: theme.radius.full,
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
    },
    iconSelectorText: {
      flex: 1,
      fontFamily: theme.fontFamilies.sansMedium,
      fontSize: 15,
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
