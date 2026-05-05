import { usePremium } from '@/src/providers/PremiumProvider';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../../src/components/ui/Header';
import { MoneyText } from '../../../src/components/ui/MoneyText';
import { PremiumGuard } from '../../../src/components/ui/PremiumGuard';
import { DEFAULT_CURRENCY } from '../../../src/constants/currency';
import { useAccounts } from '../../../src/features/accounts/hooks/accounts';
import { useTransactions } from '../../../src/features/transactions/hooks/transactions';
import { Theme, useTheme } from '../../../src/providers/ThemeProvider';

const RANGE_OPTIONS = [
  { label: '7D', value: 7 },
  { label: '30D', value: 30 },
  { label: '90D', value: 90 },
  { label: 'ALL', value: null },
] as const;

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
const DAY_FORMATTER = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

type IoniconName = keyof typeof Ionicons.glyphMap;

const resolveIconName = (raw: string | null | undefined, fallback: IoniconName): IoniconName => {
  if (raw && raw in Ionicons.glyphMap) return raw as IoniconName;
  if (raw) {
    const outlined = `${raw}-outline`;
    if (outlined in Ionicons.glyphMap) return outlined as IoniconName;
  }
  return fallback;
};

const computeFlow = (items: { type: 'CR' | 'DR'; amount: number }[]) =>
  items.reduce(
    (acc, tx) => {
      if (tx.type === 'CR') acc.income += tx.amount;
      else acc.expense += tx.amount;
      return acc;
    },
    { income: 0, expense: 0 },
  );

const AnalyticsScreen = React.memo(function AnalyticsScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const { isPremium } = usePremium();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { data: transactions, isLoading: txLoading } = useTransactions();
  const { data: accounts, isLoading: accountsLoading } = useAccounts();

  const currencyKeys = useMemo(() => {
    const keys = Array.from(new Set((accounts ?? []).map((a) => a.currency)));
    return keys.length > 0 ? keys : [DEFAULT_CURRENCY];
  }, [accounts]);

  const [selectedCurrency, setSelectedCurrency] = React.useState(currencyKeys[0]);
  const [selectedRange, setSelectedRange] = React.useState<(typeof RANGE_OPTIONS)[number]['value']>(30);

  const handleCurrencySelect = useCallback((c: string) => setSelectedCurrency(c), []);
  const handleRangeSelect = useCallback((v: typeof selectedRange) => setSelectedRange(v), []);

  const navigateToPremium = useCallback(() => router.push('/premium'), [router]);

  React.useEffect(() => {
    if (!currencyKeys.includes(selectedCurrency)) {
      setSelectedCurrency(currencyKeys[0]);
    }
  }, [currencyKeys, selectedCurrency]);

  const cutoffDate = useMemo(() => {
    if (selectedRange === null) return null;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (selectedRange - 1));
    return d;
  }, [selectedRange]);

  const filteredTransactions = useMemo(() => {
    return (transactions ?? []).filter((tx) => {
      if (tx.account.currency !== selectedCurrency) return false;
      if (!cutoffDate) return true;
      return new Date(tx.datetime) >= cutoffDate;
    });
  }, [transactions, selectedCurrency, cutoffDate]);

  const currencyAccounts = useMemo(() => {
    return (accounts ?? []).filter((a) => a.currency === selectedCurrency);
  }, [accounts, selectedCurrency]);

  const previousWindowTransactions = useMemo(() => {
    if (selectedRange === null || !cutoffDate) return [];
    const prevStart = new Date(cutoffDate);
    prevStart.setDate(prevStart.getDate() - selectedRange);
    return (transactions ?? []).filter((tx) => {
      if (tx.account.currency !== selectedCurrency) return false;
      const d = new Date(tx.datetime);
      return d >= prevStart && d < cutoffDate;
    });
  }, [transactions, selectedCurrency, selectedRange, cutoffDate]);

  const currentTotals = useMemo(() => {
    const totals = computeFlow(filteredTransactions as { type: 'CR' | 'DR'; amount: number }[]);
    const balance = currencyAccounts.reduce((s, a) => s + a.balance, 0);
    const savingsRate = totals.income > 0 ? (totals.income - totals.expense) / totals.income : 0;
    const coveredDays = selectedRange ?? Math.max(1, Math.ceil(
      (Date.now() - new Date(filteredTransactions.at(-1)?.datetime ?? Date.now()).getTime()) / 86400000
    ));
    const dailyBurn = coveredDays > 0 ? totals.expense / coveredDays : 0;
    const runwayDays = dailyBurn > 0 ? balance / dailyBurn : null;
    return { ...totals, balance, net: totals.income - totals.expense, savingsRate, dailyBurn, runwayDays, count: filteredTransactions.length };
  }, [filteredTransactions, currencyAccounts, selectedRange]);

  const previousTotals = useMemo(() => {
    const totals = computeFlow(previousWindowTransactions as { type: 'CR' | 'DR'; amount: number }[]);
    return { ...totals, net: totals.income - totals.expense };
  }, [previousWindowTransactions]);

  const comparison = useMemo(() => {
    if (selectedRange === null) return null;
    const deltaIncome = currentTotals.income - previousTotals.income;
    const deltaExpense = currentTotals.expense - previousTotals.expense;
    const deltaNet = currentTotals.net - previousTotals.net;
    return { deltaIncome, deltaExpense, deltaNet };
  }, [selectedRange, currentTotals, previousTotals]);

  const topCategories = useMemo(() => {
    const map = new Map<number, { id: number; name: string; icon: string | null; color: string; amount: number; count: number }>();
    filteredTransactions
      .filter((tx) => tx.type === 'DR' && tx.category)
      .forEach((tx) => {
        if (!tx.category) return;
        const cur = map.get(tx.category.id);
        const color = tx.category.color ? `#${tx.category.color.toString(16).padStart(6, '0')}` : colors.primary;
        if (cur) {
          cur.amount += tx.amount;
          cur.count += 1;
        } else {
          map.set(tx.category.id, { id: tx.category.id, name: tx.category.name, icon: tx.category.icon, color, amount: tx.amount, count: 1 });
        }
      });
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount).slice(0, 5);
  }, [filteredTransactions, colors.primary]);

  const accountBreakdown = useMemo(() => {
    const total = currencyAccounts.reduce((s, a) => s + Math.max(a.balance, 0), 0);
    return currencyAccounts.map((a) => ({
      ...a,
      colorHex: `#${a.color.toString(16).padStart(6, '0')}`,
      share: total > 0 ? Math.max(a.balance, 0) / total : 0,
    })).sort((a, b) => b.balance - a.balance).slice(0, 5);
  }, [currencyAccounts]);

  const trendDays = useMemo(() => {
    const buckets = new Map<string, { date: Date; income: number; expense: number }>();
    const today = new Date();
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setHours(0, 0, 0, 0);
      d.setDate(today.getDate() - i);
      buckets.set(d.toISOString().slice(0, 10), { date: d, income: 0, expense: 0 });
    }
    filteredTransactions.forEach((tx) => {
      const d = new Date(tx.datetime);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10);
      const b = buckets.get(key);
      if (!b) return;
      if (tx.type === 'CR') b.income += tx.amount;
      else b.expense += tx.amount;
    });
    return Array.from(buckets.values());
  }, [filteredTransactions]);

  const trendMax = useMemo(() => Math.max(1, ...trendDays.flatMap((d) => [d.income, d.expense])), [trendDays]);

  const latestTransactions = useMemo(() => filteredTransactions.slice(0, 5), [filteredTransactions]);

  if (txLoading || accountsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Analytics" subtitle="Data-driven financial review" showBack />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Controls */}
        <View style={styles.controlCard}>
          <Text style={styles.cardLabel}>CURRENCY</Text>
          <View style={styles.segmentRow}>
            {currencyKeys.map((c) => {
              const active = c === selectedCurrency;
              return (
                <TouchableOpacity
                  key={c}
                  style={[styles.segmentPill, active && styles.segmentPillActive]}
                  onPress={() => handleCurrencySelect(c)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{c}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.cardLabel, { marginTop: 12 }]}>WINDOW</Text>
          <View style={styles.segmentRow}>
            {RANGE_OPTIONS.map((opt) => {
              const active = opt.value === selectedRange;
              const isLocked = !isPremium && opt.value !== 7;
              return (
                <TouchableOpacity
                  key={opt.label}
                  style={[styles.segmentPill, active && styles.segmentPillActive, isLocked && styles.segmentPillLocked]}
                  onPress={() => (isLocked ? navigateToPremium() : handleRangeSelect(opt.value))}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{opt.label}</Text>
                  {isLocked && <Ionicons name="lock-closed" size={10} color={colors.textMuted} style={{ marginLeft: 2 }} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Period selector */}
        <View style={styles.heroSection}>
          <Text style={styles.heroKicker}>
            {selectedRange === null ? 'ALL TIME' : `LAST ${selectedRange} DAYS`}
          </Text>
          <Text style={styles.heroTitle}>
            {currentTotals.net >= 0 ? 'In the Green.' : 'In the Red.'}
          </Text>
          <View style={styles.heroNetRow}>
            <MoneyText
              amount={Math.abs(currentTotals.net)}
              currency={selectedCurrency}
              type={currentTotals.net >= 0 ? 'CR' : 'DR'}
              style={styles.heroAmount}
              weight="sansBold"
            />
            <Text style={styles.heroNetLabel}>net position</Text>
          </View>
          <Text style={styles.heroSubtitle}>
            {currentTotals.savingsRate >= 0.2
              ? 'Strong savings discipline — your financial posture is healthy.'
              : currentTotals.savingsRate >= 0
                ? 'Positive trajectory — room to optimise your savings rate.'
                : 'Spending exceeds income — review your expense categories.'}
          </Text>
        </View>

        {/* KPI Grid */}
        <PremiumGuard label="Unlock Analytics" size="large">
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Income</Text>
              <MoneyText amount={currentTotals.income} currency={selectedCurrency} type="CR" style={styles.kpiValue} weight="sansBold" />
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Expense</Text>
              <MoneyText amount={currentTotals.expense} currency={selectedCurrency} type="DR" style={styles.kpiValue} weight="sansBold" />
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Savings rate</Text>
              <Text style={styles.kpiPlainValue}>{(currentTotals.savingsRate * 100).toFixed(1)}%</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Runway</Text>
              <Text style={styles.kpiPlainValue}>
                {currentTotals.runwayDays === null ? 'No burn' : `${Math.max(0, currentTotals.runwayDays).toFixed(0)}d`}
              </Text>
            </View>
          </View>

          {/* Period Comparison */}
          {comparison && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Period comparison</Text>
              <Text style={styles.sectionHint}>vs previous {selectedRange}D</Text>
              <View style={styles.deltaCard}>
                <View style={styles.deltaRow}>
                  <View style={styles.deltaMeta}>
                    <Ionicons name={comparison.deltaIncome >= 0 ? 'arrow-up' : 'arrow-down'} size={14} color={comparison.deltaIncome >= 0 ? colors.success : colors.danger} />
                    <Text style={styles.deltaLabel}>Income</Text>
                  </View>
                  <MoneyText amount={Math.abs(comparison.deltaIncome)} currency={selectedCurrency} type={comparison.deltaIncome >= 0 ? 'CR' : 'DR'} style={styles.deltaValue} weight="sansBold" />
                </View>
                <View style={styles.deltaRow}>
                  <View style={styles.deltaMeta}>
                    <Ionicons name={comparison.deltaExpense <= 0 ? 'arrow-down' : 'arrow-up'} size={14} color={comparison.deltaExpense <= 0 ? colors.success : colors.danger} />
                    <Text style={styles.deltaLabel}>Expense</Text>
                  </View>
                  <MoneyText amount={Math.abs(comparison.deltaExpense)} currency={selectedCurrency} type={comparison.deltaExpense <= 0 ? 'CR' : 'DR'} style={styles.deltaValue} weight="sansBold" />
                </View>
                <View style={[styles.deltaRow, { borderBottomWidth: 0 }]}>
                  <View style={styles.deltaMeta}>
                    <Ionicons name={comparison.deltaNet >= 0 ? 'trending-up' : 'trending-down'} size={14} color={comparison.deltaNet >= 0 ? colors.success : colors.danger} />
                    <Text style={styles.deltaLabel}>Net</Text>
                  </View>
                  <MoneyText amount={Math.abs(comparison.deltaNet)} currency={selectedCurrency} type={comparison.deltaNet >= 0 ? 'CR' : 'DR'} style={styles.deltaValue} weight="sansBold" />
                </View>
              </View>
            </View>
          )}

          {/* Category Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Category breakdown</Text>
            <Text style={styles.sectionHint}>{topCategories.length} categories</Text>
            <View style={styles.card}>
              {topCategories.length > 0 ? topCategories.map((cat, i) => {
                const width = currentTotals.expense > 0 ? (cat.amount / currentTotals.expense) * 100 : 0;
                return (
                  <View key={cat.id} style={[styles.catRow, i === topCategories.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={[styles.catIcon, { backgroundColor: cat.color + '18' }]}>
                      <Ionicons name={resolveIconName(cat.icon, 'pricetag-outline')} size={14} color={cat.color} />
                    </View>
                    <View style={styles.catBody}>
                      <View style={styles.catTop}>
                        <Text style={styles.catName}>{cat.name}</Text>
                        <MoneyText amount={cat.amount} currency={selectedCurrency} type="DR" style={styles.catAmount} weight="sansBold" />
                      </View>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${width}%`, backgroundColor: cat.color }]} />
                      </View>
                      <Text style={styles.catMeta}>{cat.count} txns</Text>
                    </View>
                  </View>
                );
              }) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No expense data in this period.</Text>
                </View>
              )}
            </View>
          </View>

          {/* Account Allocation */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Account allocation</Text>
            <Text style={styles.sectionHint}>{currencyAccounts.length} accounts</Text>
            <View style={styles.card}>
              {accountBreakdown.length > 0 ? accountBreakdown.map((acc, i) => (
                <View key={acc.id} style={[styles.catRow, i === accountBreakdown.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={[styles.catIcon, { backgroundColor: acc.colorHex + '18' }]}>
                    <Ionicons name={resolveIconName(acc.icon, 'wallet-outline')} size={14} color={acc.colorHex} />
                  </View>
                  <View style={styles.catBody}>
                    <View style={styles.catTop}>
                      <Text style={styles.catName}>{acc.name}</Text>
                      <MoneyText amount={acc.balance} currency={selectedCurrency} style={styles.catAmount} weight="sansBold" />
                    </View>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${acc.share * 100}%`, backgroundColor: acc.colorHex }]} />
                    </View>
                    <Text style={styles.catMeta}>{Math.round(acc.share * 100)}% allocation</Text>
                  </View>
                </View>
              )) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No accounts in {selectedCurrency}.</Text>
                </View>
              )}
            </View>
          </View>

          {/* 7-Day Trend */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>7-day flow trend</Text>
            <Text style={styles.sectionHint}>Income vs expense</Text>
            <View style={styles.card}>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                  <Text style={styles.legendText}>Income</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
                  <Text style={styles.legendText}>Expense</Text>
                </View>
              </View>
              {trendDays.map((day) => (
                <View key={day.date.toISOString()} style={styles.trendRow}>
                  <View style={styles.trendDayWrap}>
                    <Text style={styles.trendDay}>{WEEKDAY_FORMATTER.format(day.date)}</Text>
                    <Text style={styles.trendDate}>{DAY_FORMATTER.format(day.date)}</Text>
                  </View>
                  <View style={styles.trendBars}>
                    <View style={styles.trendBarTrack}>
                      <View style={[styles.trendBarFill, styles.trendIncomeFill, { width: `${(day.income / trendMax) * 100}%` }]} />
                    </View>
                    <View style={styles.trendBarTrack}>
                      <View style={[styles.trendBarFill, styles.trendExpenseFill, { width: `${(day.expense / trendMax) * 100}%` }]} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Recent activity</Text>
            <Text style={styles.sectionHint}>{currentTotals.count} total</Text>
            <View style={styles.card}>
              {latestTransactions.length > 0 ? latestTransactions.map((tx, i) => {
                const isTransfer = tx.type === 'TRANSFER';
                const accentColor = tx.category?.color
                  ? `#${tx.category.color.toString(16).padStart(6, '0')}`
                  : isTransfer ? colors.primary : colors.textMuted;
                const iconName = isTransfer
                  ? 'swap-horizontal-outline'
                  : resolveIconName(tx.category?.icon, 'pricetag-outline');
                const categoryName = tx.category?.name || (isTransfer ? 'Transfer' : 'Transaction');
                return (
                  <View key={tx.id} style={[styles.txRow, i === latestTransactions.length - 1 && styles.txRowLast]}>
                    <View style={[styles.txAccent, { backgroundColor: tx.type === 'CR' ? colors.success : tx.type === 'TRANSFER' ? colors.primary : colors.danger }]} />
                    <View style={[styles.txIcon, { backgroundColor: accentColor + '18' }]}>
                      <Ionicons name={iconName} size={14} color={accentColor} />
                    </View>
                    <View style={styles.txBody}>
                      <View style={styles.txTop}>
                        <Text style={styles.txTitle}>{tx.note || categoryName}</Text>
                        <MoneyText amount={tx.amount} currency={selectedCurrency} type={tx.type} style={styles.txAmount} weight="sansBold" />
                      </View>
                      <Text style={styles.txMeta}>{tx.account.name} · {DATE_TIME_FORMATTER.format(new Date(tx.datetime))}</Text>
                    </View>
                  </View>
                );
              }) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No transactions in this range.</Text>
                </View>
              )}
            </View>
          </View>
        </PremiumGuard>
      </ScrollView>
    </SafeAreaView>
  );
});

export default AnalyticsScreen;

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    overflow: 'hidden',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 46,
  },
  controlCard: {
    padding: 16,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 14,
  },
  cardLabel: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    color: theme.colors.textMuted,
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  segmentPill: {
    minWidth: 52,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background + '80',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  segmentPillActive: {
    backgroundColor: theme.colors.text,
  },
  segmentPillLocked: {
    opacity: 0.6,
  },
  segmentText: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    color: theme.colors.textMuted,
    fontSize: 11,
    letterSpacing: 0.6,
  },
  segmentTextActive: {
    color: theme.colors.background,
  },
  heroSection: {
    marginBottom: 28,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: theme.radius['3xl'],
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  heroKicker: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 10,
    color: theme.colors.primary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  heroTitle: {
    fontFamily: theme.fontFamilies.heading,
    fontSize: 34,
    lineHeight: 38,
    color: theme.colors.text,
    letterSpacing: -1.5,
    marginBottom: 4,
  },
  heroNetRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 8,
  },
  heroAmount: {
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  heroNetLabel: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  heroSubtitle: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  kpiCard: {
    width: '47%',
    padding: 14,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 8,
  },
  kpiLabel: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 10,
    color: theme.colors.textMuted,
    letterSpacing: 0.8,
  },
  kpiValue: {
    fontSize: 16,
  },
  kpiPlainValue: {
    fontFamily: theme.fontFamilies.mono,
    fontSize: 16,
    color: theme.colors.text,
  },
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 10,
    color: theme.colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  sectionHint: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 11,
    color: theme.colors.textMuted,
    marginBottom: 10,
  },
  card: {
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
  },
  deltaCard: {
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  deltaMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  deltaLabel: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    color: theme.colors.textMuted,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  deltaValue: {
    fontSize: 13,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background + '40',
    gap: 12,
  },
  catIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catBody: {
    flex: 1,
  },
  catTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  catName: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    color: theme.colors.text,
    fontSize: 14,
  },
  catAmount: {
    fontSize: 14,
  },
  progressTrack: {
    height: 4,
    backgroundColor: theme.colors.background + '80',
    borderRadius: theme.radius.full,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radius.full,
  },
  catMeta: {
    fontFamily: theme.fontFamilies.sans,
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: theme.radius.full,
  },
  legendText: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    color: theme.colors.textMuted,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  trendDayWrap: {
    width: 40,
  },
  trendDay: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    color: theme.colors.text,
    fontSize: 11,
  },
  trendDate: {
    fontFamily: theme.fontFamilies.sans,
    color: theme.colors.textMuted,
    fontSize: 9,
  },
  trendBars: {
    flex: 1,
    gap: 4,
  },
  trendBarTrack: {
    height: 6,
    backgroundColor: theme.colors.background + '80',
    borderRadius: 3,
    overflow: 'hidden',
  },
  trendBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  trendIncomeFill: {
    backgroundColor: theme.colors.success,
  },
  trendExpenseFill: {
    backgroundColor: theme.colors.danger,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background + '40',
    gap: 12,
    position: 'relative',
  },
  txRowLast: {
    borderBottomWidth: 0,
  },
  txAccent: {
    position: 'absolute',
    left: -14,
    top: 12,
    bottom: 12,
    width: 3,
    borderRadius: theme.radius.sm,
  },
  txIcon: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txBody: {
    flex: 1,
  },
  txTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  txTitle: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    color: theme.colors.text,
    fontSize: 13,
    flex: 1,
  },
  txAmount: {
    fontSize: 13,
  },
  txMeta: {
    fontFamily: theme.fontFamilies.sans,
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: theme.fontFamilies.sans,
    color: theme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
});
