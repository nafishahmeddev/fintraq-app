import { CurrencyPickerModal } from '@/src/components/ui/CurrencyPickerModal';
import { Header } from '@/src/components/ui/Header';
import { IconPickerDialog } from '@/src/components/ui/IconPickerDialog';
import { ACCOUNT_COLORS } from '@/src/constants/picker';
import { ACCOUNT_TYPES, AccountType } from '@/src/db/schema';
import { useCreateAccount } from '@/src/features/accounts/hooks/accounts';
import { useTheme } from '@/src/providers/ThemeProvider';
import { ThemeColors } from '@/src/theme/colors';
import { TYPOGRAPHY } from '@/src/theme/typography';
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
  const { colors } = useTheme();
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.label}>Account Name</Text>
          <Controller
            control={control}
            name="name"
            rules={{ required: 'Account name is required' }}
            render={({ field }) => (
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="Main Wallet"
                placeholderTextColor={colors.textMuted + '50'}
                autoFocus
                style={styles.answerInput}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
              />
            )}
          />
          <View style={[styles.answerLine, errors.name && styles.answerLineError]} />

          <Text style={[styles.label, styles.labelSpaced]}>Holder Name</Text>
          <Controller
            control={control}
            name="holderName"
            render={({ field }) => (
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="Account Holder"
                placeholderTextColor={colors.textMuted + '50'}
                style={styles.answerInput}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
              />
            )}
          />
          <View style={styles.answerLine} />

          <Text style={[styles.label, styles.labelSpaced]}>Account Number</Text>
          <Controller
            control={control}
            name="accountNumber"
            render={({ field }) => (
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="IBAN / Account Number"
                placeholderTextColor={colors.textMuted + '50'}
                style={styles.answerInput}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="next"
              />
            )}
          />
          <View style={styles.answerLine} />

          <Text style={[styles.label, styles.labelSpaced]}>Account Type</Text>
          <View style={styles.typeGrid}>
            {ACCOUNT_TYPES.map((type: AccountType) => (
              <TouchableOpacity
                key={type}
                activeOpacity={0.9}
                onPress={() => setAccountType(type)}
                style={[
                  styles.typeCell,
                  accountType === type && { backgroundColor: colorHex, borderColor: colorHex },
                  accountType === type && styles.typeCellActive,
                ]}
              >
                <Ionicons
                  name={ACCOUNT_TYPE_ICONS[type] as any}
                  size={16}
                  color={accountType === type ? '#000100' : colors.text}
                />
                <Text
                  style={[
                    styles.typeLabel,
                    { color: accountType === type ? '#000100' : colors.text },
                  ]}
                >
                  {ACCOUNT_TYPE_LABELS[type]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, styles.labelSpaced]}>Opening Balance</Text>
          <Controller
            control={control}
            name="balance"
            rules={{
              validate: (v) =>
                !v.trim() || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0) || 'Enter a valid amount',
            }}
            render={({ field }) => (
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted + '50'}
                keyboardType="decimal-pad"
                style={[styles.answerInput, styles.answerInputAmount]}
                returnKeyType="done"
              />
            )}
          />
          <View style={[styles.answerLine, errors.balance && styles.answerLineError]} />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Currency</Text>
          <TouchableOpacity
            style={styles.currencyRow}
            onPress={() => setShowCurrencyPicker(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.currencyValue}>{currency}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.answerLine} />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Icon</Text>
          <TouchableOpacity
            style={styles.iconSelector}
            onPress={() => setShowIconPicker(true)}
            activeOpacity={0.85}
          >
            <View style={[styles.iconPreviewBox, { backgroundColor: colorHex + '20' }]}>
              <Ionicons name={resolveIcon(iconKey, 'wallet-outline')} size={24} color={colorHex} />
            </View>
            <Text style={styles.iconSelectorText}>{iconKey.replace('-outline', '').replace('-', ' ')}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.answerLine} />
        </View>

        <View style={[styles.section, styles.sectionLast]}>
          <Text style={styles.label}>Color</Text>
          <View style={styles.colorGrid}>
            {ACCOUNT_COLORS.map((item: string) => (
              <TouchableOpacity
                key={item}
                activeOpacity={0.9}
                onPress={() => setColorHex(item)}
                style={[
                  styles.colorCell,
                  { backgroundColor: item },
                  colorHex === item && styles.colorCellActive,
                ]}
              >
                {colorHex === item ? <Ionicons name="checkmark" size={14} color="#000100" /> : null}
              </TouchableOpacity>
            ))}
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
          <Text style={styles.primaryBtnText}>Create Account</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFF" />
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 24,
      paddingTop: 10,
      paddingBottom: 120,
    },
    section: {
      paddingBottom: 22,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 22,
    },
    sectionLast: {
      borderBottomWidth: 0,
      marginBottom: 0,
      paddingBottom: 0,
    },
    label: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 13,
      color: colors.textMuted,
      letterSpacing: 0.1,
      marginBottom: 6,
    },
    labelSpaced: {
      marginTop: 16,
    },
    answerInput: {
      fontFamily: TYPOGRAPHY.fonts.heading,
      fontSize: 28,
      lineHeight: 34,
      color: colors.text,
      letterSpacing: -0.7,
      paddingHorizontal: 0,
      paddingVertical: 4,
    },
    answerInputAmount: {
      fontFamily: TYPOGRAPHY.fonts.monoBold,
      letterSpacing: 0,
    },
    answerLine: {
      height: 2,
      borderRadius: 999,
      backgroundColor: colors.primary + '55',
      marginTop: 4,
    },
    answerLineError: {
      backgroundColor: colors.danger + '88',
    },
    currencyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
    },
    currencyValue: {
      fontFamily: TYPOGRAPHY.fonts.heading,
      fontSize: 28,
      lineHeight: 34,
      color: colors.text,
      letterSpacing: -0.7,
    },
    iconSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 6,
    },
    iconPreviewBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconSelectorText: {
      flex: 1,
      fontFamily: TYPOGRAPHY.fonts.heading,
      fontSize: 20,
      color: colors.text,
      textTransform: 'capitalize',
    },
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    colorCell: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 2,
      borderColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    colorCellActive: {
      borderColor: colors.text,
      transform: [{ scale: 1.08 }],
    },
    typeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
    },
    typeCell: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.text + '10',
      backgroundColor: colors.background + 'B8',
    },
    typeCellActive: {
      borderColor: 'transparent',
    },
    typeLabel: {
      fontFamily: TYPOGRAPHY.fonts.medium,
      fontSize: 12,
    },
    footer: {
      position: 'absolute',
      bottom: 34,
      left: 24,
      right: 24,
    },
    primaryBtn: {
      height: 56,
      borderRadius: 16,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 5,
    },
    primaryBtnDisabled: {
      opacity: 0.45,
    },
    primaryBtnText: {
      fontFamily: TYPOGRAPHY.fonts.heading,
      fontSize: 14,
      color: '#FFFFFF',
      letterSpacing: 0.3,
      marginRight: 10,
    },
  });
