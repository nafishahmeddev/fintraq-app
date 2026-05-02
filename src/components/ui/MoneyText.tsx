import React, { useMemo } from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';
import { Theme, useTheme } from '../../providers/ThemeProvider';
import { TransactionType } from '../../types';
import { formatCurrency } from '../../utils/format';

interface MoneyTextProps extends TextProps {
  amount: number;
  currency?: string;
  type?: TransactionType | 'NONE';
  weight?: keyof Theme['fontFamilies'];
  display?: boolean;
}

export const MoneyText = React.memo(function MoneyText({
  amount,
  currency,
  type = 'NONE',
  weight = 'monoBold',
  display = false,
  style,
  ...props
}: MoneyTextProps) {
  const theme = useTheme();

  const styles = useMemo(() => createStyles(theme), [theme]);

  const { prefix, color, formattedAmount, fontFamily } = useMemo(() => {
    const isCustomSign = type === 'CR' || type === 'DR';
    const valToFormat = isCustomSign ? Math.abs(amount) : amount;
    const formatted = formatCurrency(valToFormat, currency);

    let p = '';
    let c = theme.colors.text;

    if (type === 'CR') {
      p = '+';
      c = theme.colors.success;
    } else if (type === 'DR') {
      p = '-';
      c = theme.colors.danger;
    }

    const isBold = weight.toLowerCase().includes('bold') || weight === 'heading';
    const ff = isBold ? theme.fontFamilies.monoBold : theme.fontFamilies.mono;

    return { prefix: p, color: c, formattedAmount: formatted, fontFamily: ff };
  }, [type, amount, currency, weight, theme]);

  const displayStyle = display ? { fontSize: 40, letterSpacing: -1.5, lineHeight: 44 } : undefined;

  return (
    <Text
      style={[
        styles.base,
        { color, fontFamily },
        displayStyle,
        style,
      ]}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.72}
      ellipsizeMode="tail"
      {...props}
    >
      {prefix}{formattedAmount}
    </Text>
  );
});

const createStyles = ({ fontSizes, fontFamilies }: Theme) => StyleSheet.create({
  base: {
    fontSize: fontSizes.md,
    flexShrink: 1,
    fontFamily: fontFamilies.mono
  }
});
