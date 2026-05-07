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
  const styles = useMemo(() => createBadgeStyles(theme), [theme]);
  if (!change || change.diff === 0) return null;
  const isGood = inverse ? change.diff < 0 : change.diff > 0;
  const c = isGood ? theme.colors.success : theme.colors.danger;
  return (
    <View style={[styles.badge, { backgroundColor: c + '25' }]}>
      <Ionicons name={isGood ? 'arrow-up' : 'arrow-down'} size={8} color={c} />
      <Text style={[styles.badgeText, { color: c }]}>
        {Math.abs(change.pct).toFixed(0)}%
      </Text>
    </View>
  );
}

const createBadgeStyles = (theme: Theme) => StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: 2,
    borderRadius: theme.radius.full,
  },
  badgeText: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 9,
    letterSpacing: 0.2,
  },
});

export const HeroBalanceCard = React.memo(function HeroBalanceCard({
  balancesByCurrency,
  selectedCurrency,
  currencyKeys,
  monthlyData,
  onCurrencySelect,
}: HeroBalanceCardProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const thisMonth = monthlyData?.thisMonth ?? { income: 0, expense: 0 };
  const lastMonth = monthlyData?.lastMonth ?? { income: 0, expense: 0 };
  const incomeChange = useMemo(() => calcChange(thisMonth.income, lastMonth.income), [thisMonth.income, lastMonth.income]);
  const expenseChange = useMemo(() => calcChange(thisMonth.expense, lastMonth.expense), [thisMonth.expense, lastMonth.expense]);

  return (
    <View style={styles.card}>
      {currencyKeys.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {currencyKeys.map(curr => (
            <TouchableOpacity
              key={curr}
              style={[styles.tab, selectedCurrency === curr && styles.tabActive]}
              onPress={() => onCurrencySelect(curr)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, selectedCurrency === curr && styles.tabTextActive]}>{curr}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <Text style={styles.balanceLabel}>Total balance</Text>
      <MoneyText
        amount={balancesByCurrency[selectedCurrency] || 0}
        currency={selectedCurrency}
        style={styles.balance}
        weight="sansBold"
        display
      />

      <View style={styles.divider} />

      <Text style={styles.monthLabel}>THIS MONTH</Text>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={styles.statTop}>
            <Text style={styles.statLabel}>Income</Text>
            <ChangeBadge change={incomeChange} />
          </View>
          <MoneyText
            amount={thisMonth.income}
            currency={selectedCurrency}
            type="CR"
            style={styles.statValue}
            weight="sansBold"
          />
        </View>

        <View style={styles.verticalDivider} />

        <View style={styles.statItem}>
          <View style={styles.statTop}>
            <Text style={styles.statLabel}>Expenses</Text>
            <ChangeBadge change={expenseChange} inverse />
          </View>
          <MoneyText
            amount={thisMonth.expense}
            currency={selectedCurrency}
            type="DR"
            style={styles.statValue}
            weight="sansBold"
          />
        </View>
      </View>
    </View>
  );
});

const createStyles = (theme: Theme) => {
  const op = theme.colors.onPrimary;
  return StyleSheet.create({
    card: {
      marginHorizontal: theme.layout.screenPadding,
      marginTop: theme.spacing[12],
      marginBottom: theme.spacing[24],
      padding: theme.spacing[20],
      borderRadius: theme.radius['3xl'],
      backgroundColor: theme.colors.primary,
    },
    tabsRow: {
      flexDirection: 'row',
      gap: theme.spacing[4],
      marginBottom: theme.spacing[16],
    },
    tab: {
      paddingHorizontal: theme.spacing[12],
      paddingVertical: theme.spacing[4],
      borderRadius: theme.radius.full,
      backgroundColor: op + '18',
    },
    tabActive: {
      backgroundColor: op + '30',
    },
    tabText: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 10,
      color: op + 'B0',
    },
    tabTextActive: {
      color: op,
    },
    balanceLabel: {
      fontFamily: theme.fontFamilies.sansMedium,
      fontSize: 11,
      color: op + 'B0',
      marginBottom: theme.spacing[4],
    },
    balance: {
      fontSize: 40,
      letterSpacing: -1,
      color: op,
    },
    divider: {
      height: 1,
      backgroundColor: op + '20',
      marginVertical: theme.spacing[16],
    },
    monthLabel: {
      fontFamily: theme.fontFamilies.sansBold,
      fontSize: 10,
      letterSpacing: 1,
      color: op + '70',
      marginBottom: theme.spacing[12],
    },
    statsRow: {
      flexDirection: 'row',
      gap: theme.spacing[16],
    },
    statItem: {
      flex: 1,
      gap: theme.spacing[4],
    },
    statTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[4],
      marginBottom: 2,
    },
    statLabel: {
      fontFamily: theme.fontFamilies.sansMedium,
      fontSize: 11,
      color: op + 'B0',
    },
    statValue: {
      fontSize: 18,
      color: op,
    },
    verticalDivider: {
      width: 1,
      backgroundColor: op + '20',
    },
  });
};
