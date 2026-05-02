import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { CURRENCIES } from '../../../constants/currency';
import { CurrencyPickerModal } from '../../../components/ui/CurrencyPickerModal';
import { OnboardingFormValues } from '../types';

export function ProfileStep() {
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
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
              placeholderTextColor={theme.colors.textMuted + '80'}
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
            <Ionicons name="person-circle-outline" size={18} color={theme.colors.primary} />
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
                    color={errors.currency ? theme.colors.danger : theme.colors.textMuted} 
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

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    wrapper: {
      gap: theme.spacing[32],
    },
    section: {
      gap: theme.spacing[12],
    },
    prompt: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: theme.fontSizes.sm,
      color: theme.colors.textMuted,
      letterSpacing: 0.2,
    },
    errorText: {
      color: theme.colors.danger,
    },
    nameInput: {
      fontFamily: theme.fontFamilies.heading,
      fontSize: 52,
      lineHeight: 56,
      color: theme.colors.text,
      letterSpacing: theme.letterSpacing.tight,
      paddingHorizontal: 0,
      paddingVertical: 2,
      minHeight: 64,
    },
    nameInputError: {
      color: theme.colors.danger,
    },
    nameUnderline: {
      height: 2,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.primary + '66',
      marginTop: -2,
      marginBottom: theme.spacing[8],
    },
    nameUnderlineError: {
      backgroundColor: theme.colors.danger,
    },
    errorMessage: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: theme.fontSizes.xs,
      color: theme.colors.danger,
      marginTop: -4,
    },
    noteRow: {
      marginTop: theme.spacing[4],
      minHeight: 46,
      borderRadius: theme.radius.lg,
      paddingHorizontal: theme.spacing[12],
      paddingVertical: theme.spacing[12],
      backgroundColor: theme.colors.primary + '12',
      borderWidth: 1,
      borderColor: theme.colors.primary + '26',
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[8],
    },
    noteText: {
      fontFamily: theme.fontFamilies.sans,
      fontSize: theme.fontSizes.xs,
      lineHeight: 18,
      color: theme.colors.textMuted,
    },
    currencyTrigger: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      padding: theme.spacing[12],
      gap: theme.spacing[12],
      ...theme.shadow.xs,
    },
    currencyTriggerError: {
      borderColor: theme.colors.danger,
      backgroundColor: theme.colors.danger + '05',
    },
    currencyIconBox: {
      width: 44,
      height: 44,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.primary + '30',
    },
    currencyIconBoxError: {
      backgroundColor: theme.colors.danger + '15',
      borderColor: theme.colors.danger + '30',
    },
    currencySymbol: {
      fontSize: theme.fontSizes.lg,
      fontFamily: theme.fontFamilies.sansBold,
      color: theme.colors.primary,
    },
    currencyInfo: {
      flex: 1,
      gap: 2,
    },
    currencyCode: {
      fontFamily: theme.fontFamilies.sansBold,
      fontSize: theme.fontSizes.md,
      color: theme.colors.text,
    },
    currencyName: {
      fontFamily: theme.fontFamilies.sans,
      fontSize: theme.fontSizes.xs,
      color: theme.colors.textMuted,
    },
  });
