import { Ionicons } from '@expo/vector-icons';
import { BlurView } from '@sbaiahmed1/react-native-blur';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,

  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CurrencyPickerModal } from '../../../components/ui/CurrencyPickerModal';
import { ACCOUNT_COLORS, ACCOUNT_ICONS } from '../../../constants/picker';
import { useTheme } from '../../../providers/ThemeProvider';
import { parseAmount, toDbColor } from '../../../utils/format';
import { resolveIcon, IoniconName } from '../../../utils/icons';
import { Account, AccountType, ACCOUNT_TYPES } from '../api/accounts';
import { useCreateAccount, useUpdateAccount } from '../hooks/accounts';

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: 'Cash',
  card: 'Card',
  savings: 'Savings',
  investment: 'Investment',
  loan: 'Loan',
  other: 'Other',
};

const ACCOUNT_TYPE_ICONS: Record<AccountType, IoniconName> = {
  cash: 'cash-outline',
  card: 'card-outline',
  savings: 'save-outline',
  investment: 'trending-up-outline',
  loan: 'receipt-outline',
  other: 'folder-outline',
};

type AccountFormValues = {
  name: string;
  holderName: string;
  accountNumber: string;
  balance: string;
};

export type AccountFormModalProps = {
  visible: boolean;
  onClose: () => void;
  account?: Account;
};

export function AccountFormModal({ visible, onClose, account }: AccountFormModalProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const isEditing = !!account;
  const ModalWrapper = Platform.OS === 'ios' ? KeyboardAvoidingView : View;

  const { mutateAsync: createAccount } = useCreateAccount();
  const { mutateAsync: updateAccount } = useUpdateAccount();

  const [currency, setCurrency] = useState<string>('USD');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [colorHex, setColorHex] = useState<string>(ACCOUNT_COLORS[0]);
  const [iconKey, setIconKey] = useState<string>(ACCOUNT_ICONS[0]);
  const [accountType, setAccountType] = useState<AccountType>('cash');

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<AccountFormValues>({
    mode: 'onChange',
    defaultValues: { name: '', holderName: '', accountNumber: '', balance: '' },
  });

  useEffect(() => {
    if (!visible) return;

    if (account) {
      reset({
        name: account.name,
        holderName: account.holderName,
        accountNumber: account.accountNumber ?? '',
        balance: '',
      });
      setCurrency(account.currency);
      setColorHex(`#${account.color.toString(16).padStart(6, '0').toUpperCase()}`);
      // Re-attach '-outline' suffix so it matches the picker values
      const matchedIcon = ACCOUNT_ICONS.find((i) => i === `${account.icon}-outline`) ?? ACCOUNT_ICONS[0];
      setIconKey(matchedIcon);
      setAccountType(account.type);
      return;
    }

    reset({ name: '', holderName: '', accountNumber: '', balance: '' });
    setCurrency('USD');
    setColorHex(ACCOUNT_COLORS[0]);
    setIconKey(ACCOUNT_ICONS[0]);
  }, [account, visible, reset]);

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
      if (isEditing && account) {
        await updateAccount({ id: account.id, data: payload });
      } else {
        await createAccount(payload);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save account:', error);
    }
  });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <ModalWrapper
        style={styles.overlay}
        {...(Platform.OS === 'ios' ? { behavior: 'padding' as const, keyboardVerticalOffset: 0 } : {})}
      >
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <View style={styles.sheet}>
          <View className="absolute inset-0" pointerEvents="none">
            <View style={[styles.glow, { top: -70, left: -70, width: 330, height: 330, backgroundColor: colors.primary + '2E' }]} />
            <View style={[styles.glow, { top: 260, right: -140, width: 480, height: 480, backgroundColor: colors.text + '0E' }]} />
            <View style={[styles.glow, { bottom: -90, left: 40, width: 320, height: 320, backgroundColor: colors.primary + '1C' }]} />
          </View>

          <BlurView
            blurAmount={Platform.OS === 'ios' ? 80 : 96}
            blurType={isDark ? 'dark' : 'light'}
            className="absolute inset-0"
          />

          {Platform.OS === 'android' && (
            <View
              pointerEvents="none"
              className="absolute inset-0" style={[ { backgroundColor: colors.background + '60' }]}
            />
          )}

          <View style={styles.handle} />

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{isEditing ? 'Edit Account' : 'New Account'}</Text>
              <Text style={styles.subtitle}>Configure where your money lives</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}
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
                    autoFocus={!isEditing}
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
                {ACCOUNT_TYPES.map((type) => (
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
                      name={ACCOUNT_TYPE_ICONS[type]}
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

              {!isEditing && (
                <>
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
                </>
              )}
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
              <View style={styles.iconGrid}>
                {ACCOUNT_ICONS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    activeOpacity={0.9}
                    onPress={() => setIconKey(item)}
                    style={[
                      styles.iconCell,
                      iconKey === item && { backgroundColor: colorHex, borderColor: colorHex },
                      iconKey === item && styles.iconCellActive,
                    ]}
                  >
                    <Ionicons name={resolveIcon(item, 'wallet-outline')} size={18} color={iconKey === item ? '#000100' : colors.text} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.section, styles.sectionLast]}>
              <Text style={styles.label}>Color</Text>
              <View style={styles.colorGrid}>
                {ACCOUNT_COLORS.map((item) => (
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

          <View
            style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 12, Platform.OS === 'ios' ? 36 : 22) }]}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.primaryBtn, !isValid && styles.primaryBtnDisabled]}
              onPress={handleSave}
              disabled={!isValid}
            >
              <Text style={styles.primaryBtnText}>{isEditing ? 'Save Account' : 'Create Account'}</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </ModalWrapper>

      <CurrencyPickerModal
        visible={showCurrencyPicker}
        onClose={() => setShowCurrencyPicker(false)}
        value={currency}
        onChange={(code) => setCurrency(code)}
      />
    </Modal>
  );
}

