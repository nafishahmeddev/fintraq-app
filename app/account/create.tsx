import { CurrencyPickerModal } from '@/src/components/ui/CurrencyPickerModal';
import { Header } from '@/src/components/ui/Header';
import { IconPickerDialog } from '@/src/components/ui/IconPickerDialog';
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
  TextInput,
  TouchableOpacity,
  View
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
    formState: { errors, isValid },
  } = useForm<AccountFormValues>({
    mode: 'onChange',
    defaultValues: { name: '', holderName: '', accountNumber: '', balance: '' },
  });

  const handleSave = handleSubmit(async (data) => {
    const accountNum = data.accountNumber.trim();
    const payload = {
      name: data.name.trim(),
      holderName: data.holderName.trim(),
      accountNumber: accountNum || null,
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
      <Header title="New Account" subtitle="Configure where your money lives" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>ACCOUNT NAME</Text>
            <View style={styles.card}>
              <Controller
                control={control}
                name="name"
                rules={{ required: 'Account name is required' }}
                render={({ field }) => (
                  <TextInput
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="e.g. Daily Spending"
                    placeholderTextColor={colors.textMuted + '80'}
                    style={styles.input}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                )}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>ACCOUNT TYPE</Text>
            <View style={styles.typeGrid}>
              {ACCOUNT_TYPES.map((type: AccountType) => {
                const isSelected = accountType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    activeOpacity={0.7}
                    onPress={() => setAccountType(type)}
                    style={[
                      styles.typeCell,
                      isSelected && { backgroundColor: colorHex, borderColor: colorHex },
                    ]}
                  >
                    <Ionicons
                      name={ACCOUNT_TYPE_ICONS[type] as any}
                      size={16}
                      color={isSelected ? colors.background : colors.text}
                    />
                    <Text
                      style={[
                        styles.typeLabel,
                        { color: isSelected ? colors.background : colors.text },
                        isSelected && { fontFamily: theme.fontFamilies.sansBold }
                      ]}
                    >
                      {ACCOUNT_TYPE_LABELS[type]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>OPENING BALANCE</Text>
            <View style={styles.card}>
              <Controller
                control={control}
                name="balance"
                rules={{
                  validate: (v) =>
                    !v.trim() || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0) || 'Enter a valid amount',
                }}
                render={({ field }) => (
                  <View style={styles.amountRow}>
                    <Text style={styles.currencySymbol}>{currency}</Text>
                    <TextInput
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="0.00"
                      placeholderTextColor={colors.textMuted + '80'}
                      keyboardType="decimal-pad"
                      style={styles.amountInput}
                    />
                  </View>
                )}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>VISUALS</Text>
            <View style={styles.visualsRow}>
              <TouchableOpacity
                style={styles.visualBtn}
                onPress={() => setShowIconPicker(true)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconBox, { backgroundColor: colorHex + '15' }]}>
                  <Ionicons name={resolveIcon(iconKey, 'wallet-outline')} size={20} color={colorHex} />
                </View>
                <Text style={styles.visualBtnText}>Icon</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.visualBtn}
                onPress={() => setShowCurrencyPicker(true)}
                activeOpacity={0.7}
              >
                <View style={styles.iconBox}>
                  <Text style={styles.currencyInitial}>{currency}</Text>
                </View>
                <Text style={styles.visualBtnText}>Currency</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PICK A COLOR</Text>
            <View style={styles.colorGrid}>
              {ACCOUNT_COLORS.map((item: string) => (
                <TouchableOpacity
                  key={item}
                  activeOpacity={0.7}
                  onPress={() => setColorHex(item)}
                  style={[
                    styles.colorCell,
                    { backgroundColor: item },
                    colorHex === item && styles.colorCellActive,
                  ]}
                >
                  {colorHex === item ? <Ionicons name="checkmark" size={16} color={colors.background} /> : null}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>EXTENDED DETAILS (OPTIONAL)</Text>
            <View style={styles.card}>
              <Controller
                control={control}
                name="holderName"
                render={({ field }) => (
                  <TextInput
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Holder Name"
                    placeholderTextColor={colors.textMuted + '80'}
                    style={[styles.input, styles.subInput]}
                  />
                )}
              />
              <View style={styles.divider} />
              <Controller
                control={control}
                name="accountNumber"
                render={({ field }) => (
                  <TextInput
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Account Number / IBAN"
                    placeholderTextColor={colors.textMuted + '80'}
                    style={[styles.input, styles.subInput]}
                  />
                )}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.primaryBtn, (!isValid || isPending) && styles.primaryBtnDisabled]}
          onPress={handleSave}
          disabled={!isValid || isPending}
        >
          <Text style={styles.primaryBtnText}>
            {isPending ? 'Creating...' : 'Create Account'}
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
        title="Select Account Icon"
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
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 140,
    },
    formSection: {
      gap: theme.spacing[24],
    },
    inputGroup: {
      gap: theme.spacing[12],
    },
    label: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 10,
      color: theme.colors.textMuted,
      letterSpacing: 1.5,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing[16],
      ...theme.shadow.xs,
    },
    input: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 16,
      color: theme.colors.text,
      paddingVertical: 0,
    },
    subInput: {
      fontSize: 14,
      fontFamily: theme.fontFamilies.sans,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: theme.spacing[12],
    },
    amountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[12],
    },
    currencySymbol: {
      fontFamily: theme.fontFamilies.sansBold,
      fontSize: 18,
      color: theme.colors.textMuted,
    },
    amountInput: {
      flex: 1,
      fontFamily: theme.fontFamilies.monoBold,
      fontSize: 24,
      color: theme.colors.text,
      paddingVertical: 0,
    },
    typeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing[8],
    },
    typeCell: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[8],
      paddingHorizontal: theme.spacing[12],
      height: 40,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },
    typeLabel: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 12,
    },
    visualsRow: {
      flexDirection: 'row',
      gap: theme.spacing[12],
    },
    visualBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[12],
      padding: theme.spacing[12],
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadow.xs,
    },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
    },
    visualBtnText: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 14,
      color: theme.colors.text,
    },
    currencyInitial: {
      fontFamily: theme.fontFamilies.sansBold,
      fontSize: 14,
      color: theme.colors.textMuted,
    },
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing[12],
    },
    colorCell: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    colorCellActive: {
      borderWidth: 2,
      borderColor: theme.colors.text,
    },
    footer: {
      position: 'absolute',
      bottom: 34,
      left: 24,
      right: 24,
    },
    primaryBtn: {
      height: 56,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.text,
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.shadow.md,
    },
    primaryBtnDisabled: {
      opacity: 0.5,
    },
    primaryBtnText: {
      fontFamily: theme.fontFamilies.sansBold,
      fontSize: 16,
      color: theme.colors.background,
    },
  });
