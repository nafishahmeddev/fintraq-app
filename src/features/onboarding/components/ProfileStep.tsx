import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../providers/ThemeProvider';
import { RADIUS } from '../../../theme/tokens';
import { TYPOGRAPHY } from '../../../theme/typography';
import { CURRENCIES } from '../../../constants/currency';
import { CurrencyPickerModal } from '../../../components/ui/CurrencyPickerModal';
import { OnboardingFormValues } from '../types';

export function ProfileStep() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const { control, formState: { errors } } = useFormContext<OnboardingFormValues>();
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  return (
    <View style={styles.wrapper}>
      <View style={styles.section}>
        <Text style={[styles.prompt, errors.name && styles.errorText]}>Tell us your name</Text>
        <Controller
          control={control}
          name="name"
          rules={{ 
            required: 'Name is required',
            minLength: { value: 2, message: 'Name must be at least 2 characters' }
          }}
          render={({ field }) => (
            <TextInput
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="John"
              placeholderTextColor={colors.textMuted + '80'}
              style={[styles.nameInput, errors.name && styles.nameInputError]}
              autoCapitalize="words"
              autoCorrect={false}
            />
          )}
        />
        <View style={[styles.nameUnderline, errors.name && styles.nameUnderlineError]} />
        
        {errors.name ? (
          <Text style={styles.errorMessage}>{errors.name.message}</Text>
        ) : (
          <View style={styles.noteRow}>
            <Ionicons name="person-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.noteText}>Used for your profile and account default holder.</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.prompt, errors.currency && styles.errorText]}>Choose your default currency</Text>
        <Controller
          control={control}
          name="currency"
          rules={{ required: 'Currency is required' }}
          render={({ field }) => {
            const selectedCurrency = CURRENCIES.find(c => c.code === field.value);
            return (
              <>
                <TouchableOpacity 
                  style={[styles.currencyTrigger, errors.currency && styles.currencyTriggerError]} 
                  onPress={() => setShowCurrencyPicker(true)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.currencyIconBox, errors.currency && styles.currencyIconBoxError]}>
                    <Text style={[styles.currencySymbol, errors.currency && styles.errorText]}>
                      {selectedCurrency?.symbol || '?'}
                    </Text>
                  </View>
                  <View style={styles.currencyInfo}>
                    <Text style={styles.currencyCode}>{field.value || 'Select'}</Text>
                    <Text style={styles.currencyName} numberOfLines={1}>
                      {selectedCurrency?.name || 'Select your default currency'}
                    </Text>
                  </View>
                  <Ionicons 
                    name="chevron-down" 
                    size={20} 
                    color={errors.currency ? colors.danger : colors.textMuted} 
                  />
                </TouchableOpacity>

                <CurrencyPickerModal
                  visible={showCurrencyPicker}
                  onClose={() => setShowCurrencyPicker(false)}
                  value={field.value}
                  onChange={field.onChange}
                />
              </>
            );
          }}
        />
        {errors.currency ? (
          <Text style={styles.errorMessage}>{errors.currency.message}</Text>
        ) : (
          <Text style={styles.noteText}>This will be your default for all new accounts.</Text>
        )}
      </View>
    </View>
  );
}

const createStyles = (colors: { [key: string]: string }) =>
  StyleSheet.create({
    wrapper: {
      gap: 32,
    },
    section: {
      gap: 12,
    },
    prompt: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 14,
      color: colors.textMuted,
      letterSpacing: 0.2,
    },
    errorText: {
      color: colors.danger,
    },
    nameInput: {
      fontFamily: TYPOGRAPHY.fonts.heading,
      fontSize: 44,
      lineHeight: 48,
      color: colors.text,
      letterSpacing: -1.2,
      paddingHorizontal: 0,
      paddingVertical: 2,
      minHeight: 58,
    },
    nameInputError: {
      color: colors.danger,
    },
    nameUnderline: {
      height: 2,
      borderRadius: 999,
      backgroundColor: colors.primary + '66',
      marginTop: -2,
      marginBottom: 8,
    },
    nameUnderlineError: {
      backgroundColor: colors.danger,
    },
    errorMessage: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 12,
      color: colors.danger,
      marginTop: -4,
    },
    noteRow: {
      marginTop: 4,
      minHeight: 46,
      borderRadius: RADIUS.lg,
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: colors.primary + '12',
      borderWidth: 1,
      borderColor: colors.primary + '26',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    noteText: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 12,
      lineHeight: 18,
      color: colors.textMuted,
    },
    currencyTrigger: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.lg,
      padding: 12,
      gap: 12,
    },
    currencyTriggerError: {
      borderColor: colors.danger,
      backgroundColor: colors.danger + '05',
    },
    currencyIconBox: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.md,
      backgroundColor: colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    currencyIconBoxError: {
      backgroundColor: colors.danger + '15',
      borderColor: colors.danger + '30',
    },
    currencySymbol: {
      fontSize: 18,
      fontFamily: TYPOGRAPHY.fonts.bold,
      color: colors.primary,
    },
    currencyInfo: {
      flex: 1,
      gap: 2,
    },
    currencyCode: {
      fontFamily: TYPOGRAPHY.fonts.bold,
      fontSize: 16,
      color: colors.text,
    },
    currencyName: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
    },
  });
