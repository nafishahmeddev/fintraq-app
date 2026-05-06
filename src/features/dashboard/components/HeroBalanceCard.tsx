import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MoneyText } from '../../../components/ui/MoneyText';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import type { MonthlyComparison } from '../api/dashboard';

interface HeroBalanceCardProps {
  balancesByCurrency: Record<string, number>;
  selectedCurrency: string;
  currencyKeys: string[];
  monthlyData: MonthlyComparison | undefined;
  onCurrencySelect: (currency: string) => void;
}

function calcChange(current: number, previous: number): { diff: number; pct: number } | null {
  if (current === 0 && previous === 0) return null;
  if (previous === 0) return { diff: current, pct: 100 };
  return { diff: current - previous, pct: ((current - previous) / previous) * 100 };
}

function ChangeBadge({ change, inverse }: { change: { diff: number; pct: number } | null; inverse?: boolean }) {
  const theme = useTheme();
  const { colors, fontFamilies } = theme;
  if (!change || change.diff === 0) return null;
  const isGood = inverse ? change.diff < 0 : change.diff > 0;
  const c = isGood ? colors.success : colors.danger;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3, backgroundColor: c + '20' }}>
      <Ionicons name={isGood ? 'arrow-up' : 'arrow-down'} size={8} color={c} />
      <Text style={{ fontFamily: fontFamilies.sansBold, fontSize: 8, letterSpacing: 0.2, color: c }}>
        {change.pct >= 0 ? '+' : ''}{change.pct.toFixed(0)}%
      </Text>
    </View>
  );
}

export const HeroBalanceCard = React.memo(function HeroBalanceCard({
  balancesByCurrency,
  selectedCurrency,
  currencyKeys,
  monthlyData,
  onCurrencySelect,
}: HeroBalanceCardProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const white = '#FFFFFF';

  const thisMonth = monthlyData?.thisMonth ?? { income: 0, expense: 0 };
  const lastMonth = monthlyData?.lastMonth ?? { income: 0, expense: 0 };
  const incomeChange = useMemo(() => calcChange(thisMonth.income, lastMonth.income), [thisMonth.income, lastMonth.income]);
  const expenseChange = useMemo(() => calcChange(thisMonth.expense, lastMonth.expense), [thisMonth.expense, lastMonth.expense]);

  return (
    <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
      {currencyKeys.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.currencyTabsRow}>
          {currencyKeys.map(curr => (
            <TouchableOpacity
              key={curr}
               style={selectedCurrency === curr ? { paddingHorizontal: 10, paddingVertical: 5, borderRadius: theme.radius.full, backgroundColor: colors.primary, borderWidth: 1, borderColor: colors.primary } : { paddingHorizontal: 10, paddingVertical: 5, borderRadius: theme.radius.full, backgroundColor: white + '15', borderWidth: 1, borderColor: 'transparent' }}
              onPress={() => onCurrencySelect(curr)}
              activeOpacity={0.8}
            >
              <Text style={selectedCurrency === curr ? { fontFamily: theme.fontFamilies.sansSemiBold, fontSize: 9, color: white } : { fontFamily: theme.fontFamilies.sansSemiBold, fontSize: 9, color: white + 'B3' }}>{curr}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <Text style={[styles.heroBadge, { color: white + 'B3' }]}>Total balance</Text>
      <MoneyText
        amount={balancesByCurrency[selectedCurrency] || 0}
        currency={selectedCurrency}
        style={[styles.heroBalance, { color: white }]}
        weight="sansBold"
        display
      />

      <Text style={[styles.sectionLabel, { color: white + 'B3' }]}>This month</Text>

      <View style={styles.splitRow}>
        <View style={styles.splitHalf}>
          <View style={styles.splitBody}>
            <View style={styles.splitTop}>
              <Text style={[styles.splitLabel, { color: white + 'B3' }]}>Income</Text>
              <ChangeBadge change={incomeChange} />
            </View>
            <MoneyText amount={thisMonth.income} currency={selectedCurrency} type="CR" style={[styles.splitValue, { color: white }]} weight="sansBold" />
          </View>
        </View>

        <View style={[styles.splitDivider, { backgroundColor: white + '30' }]} />

        <View style={styles.splitHalf}>
          <View style={styles.splitBody}>
            <View style={styles.splitTop}>
              <Text style={[styles.splitLabel, { color: white + 'B3' }]}>Expense</Text>
              <ChangeBadge change={expenseChange} inverse />
            </View>
            <MoneyText amount={thisMonth.expense} currency={selectedCurrency} type="DR" style={[styles.splitValue, { color: white }]} weight="sansBold" />
          </View>
        </View>
      </View>
    </View>
  );
});

const createStyles = (theme: Theme) => StyleSheet.create({
  heroCard: {
    marginHorizontal: theme.layout.screenPadding,
    marginTop: theme.spacing[12],
    marginBottom: theme.spacing[32],
    padding: theme.spacing[20],
    borderRadius: theme.radius['3xl'],
    backgroundColor: theme.colors.card,
  },
  currencyTabsRow: {
    flexDirection: 'row',
    gap: theme.spacing[4],
    marginBottom: theme.spacing[16],
  },
  heroBadge: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 11,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing[4],
  },
  heroBalance: {
    fontSize: 32,
    letterSpacing: -0.8,
  },
  sectionLabel: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 9,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing[12],
    marginTop: theme.spacing[12],
  },
  splitRow: {
    flexDirection: 'row',
    gap: theme.spacing[12],
  },
  splitHalf: {
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing[8],
  },
  splitBody: {
    flex: 1,
  },
  splitTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  splitLabel: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  splitValue: {
    fontSize: 17,
  },
  splitDivider: {
    width: 1,
  },
});
