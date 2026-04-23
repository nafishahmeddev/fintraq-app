import React, { useMemo } from 'react';
import {  Text, View } from 'react-native';
import { MoneyText } from '../../../components/ui/MoneyText';
import { useTheme } from '../../../providers/ThemeProvider';

import { TrendMode } from '../../../types';

interface MetricCardProps {
  label: string;
  value: number;
  currency: string;
  trendMode?: TrendMode;
  changeValue?: number;
  suffix?: string;
  isAmount?: boolean;
}

/**
 * MetricCard: A key performance indicator card for reports.
 * Used for displaying totals like "Weekly Expense" or "Savings Rate".
 *
 * Primitive Logic:
 * Internally handles trend color-coding based on trendMode.
 */
export const MetricCard = React.memo(function MetricCard({
  label,
  value,
  currency,
  trendMode = 'neutral',
  changeValue,
  suffix,
  isAmount = true
}: MetricCardProps) {
  const { colors } = useTheme();

  const trendColor = useMemo(() => {
    if (changeValue === undefined || changeValue === 0 || trendMode === 'neutral') {
      return colors.textMuted;
    }

    const isPositive = changeValue > 0;

    if (trendMode === 'high_is_good') {
      return isPositive ? colors.success : colors.danger;
    } else {
      // low_is_good (e.g. expenses)
      return isPositive ? colors.danger : colors.success;
    }
  }, [changeValue, trendMode, colors.textMuted, colors.success, colors.danger]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        {isAmount ? (
          <MoneyText 
            amount={value} 
            currency={currency} 
            style={styles.value} 
            weight="bold" 
          />
        ) : (
          <Text style={[styles.value, { color: colors.text }]}>
            {value.toFixed(1)}{suffix}
          </Text>
        )}
      </View>
      {changeValue !== undefined && (
        <View style={styles.percentageRow}>
          <Text style={[styles.percentageText, { color: trendColor }]}>
            {changeValue >= 0 ? '+' : ''}{changeValue.toFixed(1)}% vs prev.
          </Text>
        </View>
      )}
    </View>
  );
});

