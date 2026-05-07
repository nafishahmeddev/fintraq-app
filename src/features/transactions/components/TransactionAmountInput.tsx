import { Theme, useTheme } from '@/src/providers/ThemeProvider';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

type Props = {
  value: string;
  onChange: (value: string) => void;
  currency: string;
};

export const TransactionAmountInput = React.memo(function TransactionAmountInput({ value, onChange, currency }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleChangeText = useCallback((text: string) => {
    let sanitized = text.replace(/[^0-9.]/g, '');
    const parts = sanitized.split('.');
    if (parts.length > 2) {
      sanitized = parts[0] + '.' + parts.slice(1).join('');
    }
    onChange(sanitized);
  }, [onChange]);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Amount</Text>
      <View style={styles.row}>
        <Text style={styles.currency}>{currency}</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handleChangeText}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={theme.colors.textFaint}
          autoFocus
        />
      </View>
    </View>
  );
});

const createStyles = (theme: Theme) => StyleSheet.create({
  card: {
    marginHorizontal: theme.layout.screenPadding,
    marginTop: theme.spacing[16],
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['3xl'],
    paddingHorizontal: theme.spacing[20],
    paddingVertical: theme.spacing[16],
  },
  label: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 11,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing[4],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing[8],
  },
  currency: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 22,
    color: theme.colors.textMuted,
    lineHeight: 56,
  },
  input: {
    flex: 1,
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 52,
    letterSpacing: -2,
    color: theme.colors.text,
    padding: 0,
  },
});
