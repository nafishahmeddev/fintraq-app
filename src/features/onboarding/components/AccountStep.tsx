import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { TextInput } from 'react-native';
import { CurrencyPickerModal } from '@/src/components/ui/CurrencyPickerModal';
import { ACCOUNT_COLORS, ACCOUNT_ICONS } from '@/src/constants/picker';
import { ACCOUNT_TYPES, AccountType } from '@/src/db/schema';
import { useTheme } from '@/src/providers/ThemeProvider';
import { OnboardingFormValues } from '../types';
import { Box, HStack, VStack, Pressable, Text, cn } from '@/src/components/ui';

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

type AccountStepProps = {
  accountCurrency: string;
  accountIcon: string;
  accountColor: string;
  accountType: AccountType;
  onCurrencyChange: (value: string) => void;
  onIconChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onTypeChange: (value: AccountType) => void;
};

export function AccountStep({
  accountCurrency,
  accountIcon,
  accountColor,
  accountType,
  onCurrencyChange,
  onIconChange,
  onColorChange,
  onTypeChange,
}: AccountStepProps) {
  const { isDark } = useTheme();
  const { control, formState: { errors } } = useFormContext<OnboardingFormValues>();
  const [showCurrencyPicker, setShowCurrencyPicker] = React.useState(false);

  return (
    <VStack className="space-y-5">
      <VStack>
        <Text className="font-heading text-[28px] leading-8 text-text tracking-tighter mb-1.5">First Account</Text>
        <Text className="font-regular text-[13px] leading-5 text-text-muted">
          Where does your primary money live? You can add more accounts later.
        </Text>
      </VStack>

      <Controller
        control={control}
        name="accountName"
        rules={{ required: true }}
        render={({ field }) => (
          <VStack>
            <Text className="font-semibold text-[10px] text-text-muted uppercase tracking-widest pl-1 mb-2">ACCOUNT NAME</Text>
            <VStack className="bg-surface rounded-xl border border-border p-3">
              <TextInput
                className="font-semibold text-[17px] text-text px-1"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="e.g. Main Checking"
                placeholderTextColor={isDark ? '#b2bb8b60' : '#737a5f60'}
                autoCapitalize="words"
              />
            </VStack>
            {errors.accountName && <Text className="font-medium text-xs text-danger mt-1.5 pl-1">Name is required</Text>}
          </VStack>
        )}
      />

      <HStack className="space-x-4">
        <Controller
          control={control}
          name="initialBalance"
          rules={{ required: true }}
          render={({ field }) => (
            <VStack className="flex-1">
              <Text className="font-semibold text-[10px] text-text-muted uppercase tracking-widest pl-1 mb-2">INITIAL BALANCE</Text>
              <VStack className="bg-surface rounded-xl border border-border p-3">
                <TextInput
                  className="font-monoBold text-[19px] text-text px-1"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="0.00"
                  placeholderTextColor={isDark ? '#b2bb8b60' : '#737a5f60'}
                  keyboardType="decimal-pad"
                />
              </VStack>
              {errors.initialBalance && <Text className="font-medium text-xs text-danger mt-1.5 pl-1">Balance is required</Text>}
            </VStack>
          )}
        />

        <VStack className="flex-1">
          <Text className="font-semibold text-[10px] text-text-muted uppercase tracking-widest pl-1 mb-2">CURRENCY</Text>
          <Pressable
            className="h-[52px] bg-surface rounded-xl border border-border flex-row items-center px-4 space-x-2"
            onPress={() => setShowCurrencyPicker(true)}
          >
            <Ionicons name="globe-outline" size={16} color={isDark ? '#B8D641' : '#a6c13a'} />
            <Text className="flex-1 font-semibold text-[13px] text-text">{accountCurrency}</Text>
            <Ionicons name="chevron-down" size={14} color={isDark ? '#b2bb8b' : '#737a5f'} />
          </Pressable>
        </VStack>
      </HStack>

      <VStack>
        <Text className="font-semibold text-[10px] text-text-muted uppercase tracking-widest pl-1 mb-2">ACCOUNT TYPE</Text>
        <Box className="flex-row flex-wrap gap-2">
          {ACCOUNT_TYPES.map((type) => (
            <Pressable
              key={type}
              className={cn(
                "flex-row items-center h-[34px] px-3 rounded-full border space-x-1.5",
                accountType === type ? "bg-text border-text" : "bg-surface border-border"
              )}
              onPress={() => onTypeChange(type)}
            >
              <Ionicons
                name={ACCOUNT_TYPE_ICONS[type] as any}
                size={14}
                color={accountType === type ? (isDark ? '#000100' : '#F6FFF9') : (isDark ? '#b2bb8b' : '#737a5f')}
              />
              <Text className={cn("font-medium text-xs", accountType === type ? "text-background" : "text-text")}>
                {ACCOUNT_TYPE_LABELS[type]}
              </Text>
            </Pressable>
          ))}
        </Box>
      </VStack>

      <VStack>
        <Text className="font-semibold text-[10px] text-text-muted uppercase tracking-widest pl-1 mb-2">APPEARANCE</Text>
        <VStack className="bg-surface rounded-2xl border border-border p-4 space-y-4">
          <VStack>
            <Text className="font-medium text-[11px] text-text-muted mb-2">Color</Text>
            <HStack className="flex-wrap gap-2">
              {ACCOUNT_COLORS.slice(0, 6).map((hex) => {
                const isSelected = accountColor === hex;
                return (
                  <Pressable
                    key={hex}
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: hex }}
                    onPress={() => onColorChange(hex)}
                  >
                    {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                  </Pressable>
                );
              })}
            </HStack>
          </VStack>
          <Box className="h-px bg-border/50 my-1" />
          <VStack>
            <Text className="font-medium text-[11px] text-text-muted mb-2">Icon</Text>
            <HStack className="flex-wrap gap-2">
              {ACCOUNT_ICONS.slice(0, 6).map((ic) => {
                const isSelected = accountIcon === ic;
                return (
                  <Pressable
                    key={ic}
                    className={cn(
                      "w-[34px] h-[34px] rounded-xl items-center justify-center border",
                      isSelected ? "bg-text border-text" : "bg-surface border-border"
                    )}
                    onPress={() => onIconChange(ic)}
                  >
                    <Ionicons
                      name={ic as any}
                      size={16}
                      color={isSelected ? (isDark ? '#000100' : '#F6FFF9') : (isDark ? '#fbfff3' : '#000100')}
                    />
                  </Pressable>
                );
              })}
            </HStack>
          </VStack>
        </VStack>
      </VStack>

      <CurrencyPickerModal
        visible={showCurrencyPicker}
        onClose={() => setShowCurrencyPicker(false)}
        value={accountCurrency}
        onChange={onCurrencyChange}
      />
    </VStack>
  );
}
