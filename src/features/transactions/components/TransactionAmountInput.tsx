import React, { useCallback } from 'react';
import {  Text, TextInput, View } from 'react-native';

type Props = {
  value: string;
  onChange: (value: string) => void;
  currency: string;
  colors: ThemeColors;
};

export const TransactionAmountInput = ({ value, onChange, currency, colors }: Props) => {
  // Sanitize input: only allow digits and single decimal point, no negative signs
  const handleChangeText = useCallback((text: string) => {
    // Remove any non-digit and non-decimal characters
    let sanitized = text.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = sanitized.split('.');
    if (parts.length > 2) {
      sanitized = parts[0] + '.' + parts.slice(1).join('');
    }
    
    onChange(sanitized);
  }, [onChange]);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textMuted }]}>AMOUNT</Text>
      <View style={styles.inputRow}>
        <Text style={[styles.currency, { color: colors.textMuted }]}>{currency}</Text>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={value}
          onChangeText={handleChangeText}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={colors.textMuted + '40'}
          autoFocus
        />
      </View>
    </View>
  );
};

