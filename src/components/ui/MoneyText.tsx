import React, { useMemo } from 'react';
import { TextProps as RNTextProps } from 'react-native';
import { TransactionType } from '../../types';
import { formatCurrency } from '../../utils/format';
import { Text, cn } from './Text';

interface MoneyTextProps extends RNTextProps {
  amount: number;
  currency?: string;
  type?: TransactionType | 'NONE';
  className?: string;
}

export const MoneyText = React.memo(function MoneyText({
  amount,
  currency,
  type = 'NONE',
  className,
  ...props
}: MoneyTextProps) {

  const { prefix, colorClass, formattedAmount } = useMemo(() => {
    const isCustomSign = type === 'CR' || type === 'DR';
    const valToFormat = isCustomSign ? Math.abs(amount) : amount;
    const formatted = formatCurrency(valToFormat, currency);

    let p = '';
    let c = 'text-text';

    if (type === 'CR') {
      p = '+';
      c = 'text-success';
    } else if (type === 'DR') {
      p = '-';
      c = 'text-danger';
    }

    return { prefix: p, colorClass: c, formattedAmount: formatted };
  }, [amount, currency, type]);

  return (
    <Text
      className={cn(
        "font-monoBold text-base flex-shrink",
        colorClass,
        className
      )}
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