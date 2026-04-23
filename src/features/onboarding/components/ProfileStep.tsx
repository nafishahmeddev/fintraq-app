import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { TextInput } from 'react-native';
import { useTheme } from '@/src/providers/ThemeProvider';
import { OnboardingFormValues } from '../types';
import { Box, HStack, VStack, Text, cn } from '@/src/components/ui';

export function ProfileStep() {
  const { isDark } = useTheme();
  const { control, formState: { errors } } = useFormContext<OnboardingFormValues>();

  return (
    <VStack className="space-y-3">
      <Text className="font-semibold text-sm text-text-muted tracking-wide">Tell us your name</Text>
      <Controller
        control={control}
        name="name"
        rules={{ required: true }}
        render={({ field }) => (
          <TextInput
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder="John"
            placeholderTextColor={isDark ? '#b2bb8b80' : '#737a5f80'}
            className="font-heading text-[44px] leading-[48px] text-text tracking-tighter px-0 py-0.5 min-h-[58px]"
            autoCapitalize="words"
            autoCorrect={false}
          />
        )}
      />
      <Box className={cn("h-0.5 rounded-full -mt-0.5 mb-2", errors.name ? "bg-danger/60" : "bg-primary/40")} />

      <HStack className="mt-1 min-h-[46px] rounded-2xl px-3.5 py-3 bg-primary/10 border border-primary/20 items-center space-x-2.5">
        <Ionicons name="person-circle-outline" size={18} color={isDark ? '#B8D641' : '#a6c13a'} />
        <Text className="flex-1 font-regular text-xs leading-[18px] text-text">
          This name is used for your account holder and profile identity.
        </Text>
      </HStack>
    </VStack>
  );
}
