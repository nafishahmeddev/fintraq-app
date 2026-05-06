import { Theme, useTheme } from '@/src/providers/ThemeProvider';
import React, { useCallback } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

type Props = {
  value: string;
  onChange: (value: string) => void;
  currency: string;
};

export const TransactionAmountInput = ({ value, onChange, currency }: Props) => {
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
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
      <Text style={[styles.label, { color: theme.colors.textMuted }]}>Amount</Text>
      <View style={styles.inputRow}>
        <Text style={[styles.currency, { color: theme.colors.textMuted }]}>{currency}</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          value={value}
          onChangeText={handleChangeText}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={theme.colors.textMuted + '40'}
          autoFocus
        />
      </View>
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {

    paddingVertical: 12,
  },
  label: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 12,
    marginBottom: theme.spacing[2],
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing[4],
  },
  currency: {
    fontSize: theme.fontSizes['3xl'],
    fontFamily: theme.fontFamilies.sansMedium,
  },
  input: {
    flex: 1,
    fontSize: 48,
    fontFamily: theme.fontFamilies.sansBold,

  },
});
