import { resolveIcon } from '@/src/utils/icons';
import { usePremium } from '@/src/providers/PremiumProvider';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Header } from '../../src/components/ui/Header';
import { MoneyText } from '../../src/components/ui/MoneyText';
import { PremiumGuard } from '../../src/components/ui/PremiumGuard';
import { DEFAULT_CURRENCY } from '../../src/constants/currency';
import { useAccounts } from '../../src/features/accounts/hooks/accounts';
import { MonthlyPanel } from '../../src/features/stats/components/MonthlyPanel';
import { WeeklyPanel } from '../../src/features/stats/components/WeeklyPanel';
import { useTransactions } from '../../src/features/transactions/hooks/transactions';
import { useTheme } from '../../src/providers/ThemeProvider';
import { ThemeColors } from '../../src/theme/colors';
import { spacing, radius, LAYOUT } from '../../src/theme/tokens';
import { TYPOGRAPHY } from '../../src/theme/typography';

const RANGE_OPTIONS = [
  { label: '7D', value: 7 },
  { label: '30D', value: 30 },
  { label: '90D', value: 90 },
  { label: 'ALL', value: null },
] as const;

type Tab = 'overview' | 'weekly' | 'monthly';

const TAB_OPTIONS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'OVERVIEW' },
  { key: 'weekly', label: 'WEEKLY' },
  { key: 'monthly', label: 'MONTHLY' },
];

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
const DAY_FORMATTER = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

const computeFlow = (items: { type: 'CR' | 'DR'; amount: number }[]) =>
  items.reduce(
    (acc, tx) => {
      if (tx.type === 'CR') acc.income += tx.amount;
      else acc.expense += tx.amount;
      return acc;
    },
    { income: 0, expense: 0 },
  );

const StatsScreen = React.memo(function StatsScreen() {
  const { colors } = useTheme();
  const { isPremium } = usePremium();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const styles = useMemo(() => createStyles(colors, screenWidth), [colors, screenWidth]);
  const { data: transactions, isLoading: txLoading } = useTransactions();
  const { data: accounts, isLoading: accountsLoading } = useAccounts();

  const currencyKeys = useMemo(() => {
    const keys = Array.from(new Set((accounts ?? []).map((a) => a.currency)));
    return keys.length > 0 ? keys : [DEFAULT_CURRENCY];
  }, [accounts]);

  const [activeTab, setActiveTab] = React.useState<Tab>('overview');
  const [selectedCurrency, setSelectedCurrency] = React.useState(currencyKeys[0]);
  const [selectedRange, setSelectedRange] = React.useState<(typeof RANGE_OPTIONS)[number]['value']>(7);

  const handleCurrencySelect = useCallback((currency: string) => {
    setSelectedCurrency(currency);
  }, []);

  const handleRangeSelect = useCallback((value: typeof selectedRange) => {
    setSelectedRange(value);
  }, []);

  const navigateToPremium = useCallback(() => {
    router.push('/premium');
  }, [router]);

  React.useEffect(() => {
    if (!currencyKeys.includes(selectedCurrency)) {
      setSelectedCurrency(currencyKeys[0]);
    }
  }, [currencyKeys, selectedCurrency]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    const cutoff = selectedRange
      ? new Date(Date.now() - selectedRange * 24 * 60 * 60 * 1000)
      : new Date(0);
    return transactions.filter(
      (t) => new Date(t.datetime) >= cutoff && t.account.currency === selectedCurrency,
    );
  }, [transactions, selectedRange, selectedCurrency]);

  // Compute summary
  const summary = useMemo(() => {
    const income = filteredTransactions.filter((t) => t.type === 'CR').reduce((s, t) => s + t.amount, 0);
    const expense = filteredTransactions.filter((t) => t.type === 'DR').reduce((s, t) => s + t.amount, 0);
    return { income, expense, net: income - expense, balance: income - expense };
  }, [filteredTransactions]);

  // 7-day trend
  const { chartData, trendMax } = useMemo(() => {
    const days: Record<string, { income: number; expense: number; date: Date }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = DAY_FORMATTER.format(d);
      days[key] = { income: 0, expense: 0, date: d };
    }
    filteredTransactions.forEach((t) => {
      const key = DAY_FORMATTER.format(new Date(t.datetime));
      if (days[key]) {
        if (t.type === 'CR') days[key].income += t.amount;
        else days[key].expense += t.amount;
      }
    });
    const entries = Object.entries(days).sort((a, b) => a[0].localeCompare(b[0]));
    // barWidth=16, innerSpacing=3 → labelWidth=35 centers label under pair
    const INNER_SPACING = 3;
    const BAR_W = 16;
    const labelStyle = { color: colors.textMuted, fontSize: 9, fontFamily: TYPOGRAPHY.fonts.semibold };
    const data: {
      value: number; frontColor: string; label: string;
      labelTextStyle?: object; labelWidth?: number;
      barBorderRadius?: number; spacing?: number;
    }[] = [];
    entries.forEach(([_, vals], i) => {
      data.push({
        value: vals.income,
        frontColor: colors.success,
        label: WEEKDAY_FORMATTER.format(vals.date).slice(0, 2),
        labelTextStyle: labelStyle,
        labelWidth: BAR_W * 2 + INNER_SPACING,
        barBorderRadius: 6,
        spacing: INNER_SPACING,
      });
      data.push({
        value: vals.expense,
        frontColor: colors.danger,
        label: '',
        barBorderRadius: 6,
        spacing: i < entries.length - 1 ? 14 : INNER_SPACING,
      });
    });
    const maxVal = Math.max(...data.map((d) => d.value), 1);
    return { chartData: data, trendMax: maxVal * 1.1 };
  }, [filteredTransactions, colors.success, colors.danger, colors.textMuted]);

  // Practical metrics
  const practicalMetrics = useMemo(() => {
    const dayCount = selectedRange ?? 30;
    const dailyBurn = summary.expense / dayCount;
    const savingsRate = summary.income > 0 ? (summary.net) / summary.income : 0;
    const runwayDays = dailyBurn > 0 ? summary.net / dailyBurn : null;
    const flowRatio = summary.expense > 0 ? summary.income / summary.expense : null;
    return { dailyBurn, savingsRate, runwayDays, flowRatio };
  }, [summary, selectedRange]);

  // Comparison
  const comparison = useMemo(() => {
    if (!selectedRange) return null;
    const prevStart = new Date(Date.now() - selectedRange * 2 * 24 * 60 * 60 * 1000);
    const prevEnd = new Date(Date.now() - selectedRange * 24 * 60 * 60 * 1000);
    const prevTx = (transactions ?? []).filter(
      (t) =>
        new Date(t.datetime) >= prevStart &&
        new Date(t.datetime) < prevEnd &&
        t.account.currency === selectedCurrency,
    );
    const prevIncome = prevTx.filter((t) => t.type === 'CR').reduce((s, t) => s + t.amount, 0);
    const prevExpense = prevTx.filter((t) => t.type === 'DR').reduce((s, t) => s + t.amount, 0);
    const prevNet = prevIncome - prevExpense;
    const deltaIncome = prevIncome === 0 ? 0 : ((summary.income - prevIncome) / prevIncome) * 100;
    const deltaExpense = prevExpense === 0 ? 0 : ((summary.expense - prevExpense) / prevExpense) * 100;
    const deltaNet = prevNet === 0 ? 0 : ((summary.net - prevNet) / Math.abs(prevNet)) * 100;
    return { deltaIncome, deltaExpense, deltaNet };
  }, [transactions, summary, selectedRange, selectedCurrency]);

  // Top categories
  const topCategories = useMemo(() => {
    const map = new Map<number, { id: number; name: string; icon: string; color: number; amount: number }>();
    filteredTransactions
      .filter((t) => t.type === 'DR')
      .forEach((t) => {
        const existing = map.get(t.category.id);
        if (existing) existing.amount += t.amount;
        else
          map.set(t.category.id, {
            id: t.category.id,
            name: t.category.name,
            icon: t.category.icon,
            color: t.category.color,
            amount: t.amount,
          });
      });
    return Array.from(map.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [filteredTransactions]);

  // Latest transactions
  const latestTransactions = useMemo(
    () => [...filteredTransactions].sort((a, b) => +new Date(b.datetime) - +new Date(a.datetime)).slice(0, 5),
    [filteredTransactions],
  );

  // Account breakdown
  const accountBreakdown = useMemo(() => {
    const map = new Map<number, { accountId: number; name: string; balance: number; color: number; icon: string }>();
    (accounts ?? [])
      .filter((a) => a.currency === selectedCurrency)
      .forEach((a) => {
        map.set(a.id, {
          accountId: a.id,
          name: a.name,
          balance: a.balance,
          color: a.color,
          icon: a.icon,
        });
      });
    return Array.from(map.values()).sort((a, b) => b.balance - a.balance).slice(0, 5);
  }, [accounts, selectedCurrency]);

  if (txLoading || accountsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Stats" subtitle="Your financial insights" />

      {/* Global Currency Picker */}
      {currencyKeys.length > 1 && (
        <View style={styles.currencyPickerContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.currencyTabsRow}>
            {currencyKeys.map((currency) => (
              <TouchableOpacity
                key={currency}
                style={[styles.currencyTab, currency === selectedCurrency && styles.currencyTabActive]}
                onPress={() => handleCurrencySelect(currency)}
                activeOpacity={0.85}
              >
                <Text style={[styles.currencyTabText, currency === selectedCurrency && styles.currencyTabTextActive]}>
                  {currency}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && (
          <>
            {/* Range selector */}
            <View style={styles.rangeRow}>
              {RANGE_OPTIONS.map((option) => {
                const active = option.value === selectedRange;
                const isLocked = !isPremium && option.value !== 7;
                return (
                  <TouchableOpacity
                    key={option.label}
                    style={[styles.rangePill, active && styles.rangePillActive, isLocked && styles.rangePillLocked]}
                    onPress={() => {
                      if (isLocked) navigateToPremium();
                      else handleRangeSelect(option.value);
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.rangePillText, active && styles.rangePillTextActive]}>{option.label}</Text>
                    {isLocked && <Ionicons name="lock-closed" size={10} color={colors.textMuted} style={{ marginLeft: 4 }} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Net position snapshot */}
            <View style={styles.snapshotCard}>
              <View style={styles.snapshotTopRow}>
                <Text style={styles.snapshotKicker}>NET POSITION</Text>
                <View style={styles.rangeBadge}>
                  <Text style={styles.rangeBadgeText}>
                    {selectedRange === null ? 'ALL TIME' : `${selectedRange} DAYS`}
                  </Text>
                </View>
              </View>
              <MoneyText
                amount={Math.abs(summary.net)}
                currency={selectedCurrency}
                type={summary.net >= 0 ? 'CR' : 'DR'}
                style={styles.snapshotAmount}
                weight="bold"
                showSign={false}
              />
              <View style={styles.snapshotStatsRow}>
                <View style={styles.snapshotStat}>
                  <View style={[styles.snapshotDot, { backgroundColor: colors.success }]} />
                  <View>
                    <Text style={styles.snapshotStatLabel}>INCOME</Text>
                    <MoneyText amount={summary.income} currency={selectedCurrency} type="CR" style={styles.snapshotStatValue} showSign={false} />
                  </View>
                </View>
                <View style={styles.snapshotStatDivider} />
                <View style={styles.snapshotStat}>
                  <View style={[styles.snapshotDot, { backgroundColor: colors.danger }]} />
                  <View>
                    <Text style={styles.snapshotStatLabel}>EXPENSE</Text>
                    <MoneyText amount={summary.expense} currency={selectedCurrency} type="DR" style={styles.snapshotStatValue} showSign={false} />
                  </View>
                </View>
              </View>
            </View>

            {/* 7-day flow bar chart */}
            <Text style={styles.sectionTitle}>7-DAY FLOW</Text>
            <View style={styles.chartCard}>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                  <Text style={styles.legendText}>In</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
                  <Text style={styles.legendText}>Out</Text>
                </View>
              </View>
              {chartData.length > 0 ? (
                <BarChart
                  data={chartData}
                  barWidth={16}
                  height={160}
                  maxValue={trendMax}
                  noOfSections={3}
                  yAxisThickness={0}
                  yAxisLabelWidth={0}
                  xAxisThickness={1}
                  xAxisColor={colors.border}
                  hideYAxisText
                  disableScroll
                  width={screenWidth - 80}
                  isAnimated
                  animationDuration={400}
                  backgroundColor="transparent"
                  barBorderRadius={8}
                />
              ) : (
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>No data available</Text>
              )}
            </View>

            {/* Practical insights */}
            <Text style={styles.sectionTitle}>PRACTICAL INSIGHTS</Text>
            <PremiumGuard label="Insights Pro" size="medium">
              <View style={styles.insightsCard}>
                <View style={styles.insightRow}>
                  <View style={styles.insightCell}>
                    <Text style={styles.insightLabel}>AVG DAILY BURN</Text>
                    <MoneyText amount={practicalMetrics.dailyBurn} currency={selectedCurrency} type="DR" style={styles.insightValue} showSign={false} />
                  </View>
                  <View style={styles.insightDivider} />
                  <View style={styles.insightCell}>
                    <Text style={styles.insightLabel}>SAVINGS RATE</Text>
                    <Text style={styles.insightValue}>{`${(practicalMetrics.savingsRate * 100).toFixed(1)}%`}</Text>
                  </View>
                </View>
                <View style={styles.insightRowDivider} />
                <View style={styles.insightRow}>
                  <View style={styles.insightCell}>
                    <Text style={styles.insightLabel}>RUNWAY</Text>
                    <Text style={styles.insightValue}>
                      {practicalMetrics.runwayDays === null ? 'No burn' : `${Math.max(0, practicalMetrics.runwayDays).toFixed(0)} days`}
                    </Text>
                  </View>
                  <View style={styles.insightDivider} />
                  <View style={styles.insightCell}>
                    <Text style={styles.insightLabel}>IN/OUT RATIO</Text>
                    <Text style={styles.insightValue}>
                      {practicalMetrics.flowRatio === null ? 'N/A' : `${practicalMetrics.flowRatio.toFixed(2)}x`}
                    </Text>
                  </View>
                </View>
              </View>
            </PremiumGuard>

            {/* Period delta */}
            <Text style={styles.sectionTitle}>PERIOD DELTA</Text>
            <PremiumGuard label="Comparison Pro" size="medium">
              <View style={styles.deltaCard}>
                {comparison ? (
                  <>
                    <View style={styles.deltaRow}>
                      <View style={styles.deltaMeta}>
                        <Ionicons name={comparison.deltaIncome >= 0 ? 'arrow-up' : 'arrow-down'} size={14} color={comparison.deltaIncome >= 0 ? colors.success : colors.danger} />
                        <Text style={styles.deltaLabel}>INCOME</Text>
                      </View>
                      <Text style={styles.deltaValue}>{Math.abs(comparison.deltaIncome).toFixed(1)}%</Text>
                    </View>
                    <View style={styles.deltaDivider} />
                    <View style={styles.deltaRow}>
                      <View style={styles.deltaMeta}>
                        <Ionicons name={comparison.deltaExpense <= 0 ? 'arrow-down' : 'arrow-up'} size={14} color={comparison.deltaExpense <= 0 ? colors.success : colors.danger} />
                        <Text style={styles.deltaLabel}>EXPENSE</Text>
                      </View>
                      <Text style={styles.deltaValue}>{Math.abs(comparison.deltaExpense).toFixed(1)}%</Text>
                    </View>
                    <View style={styles.deltaDivider} />
                    <View style={styles.deltaRow}>
                      <View style={styles.deltaMeta}>
                        <Ionicons name={comparison.deltaNet >= 0 ? 'trending-up' : 'trending-down'} size={14} color={comparison.deltaNet >= 0 ? colors.success : colors.danger} />
                        <Text style={styles.deltaLabel}>NET</Text>
                      </View>
                      <Text style={styles.deltaValue}>{Math.abs(comparison.deltaNet).toFixed(1)}%</Text>
                    </View>
                  </>
                ) : (
                  <EmptyState
                    title="Comparison unavailable"
                    description="Select a fixed range (7D, 30D, or 90D) to see period comparison."
                    size="compact"
                    variant="inline"
                    fullHeight={false}
                  />
                )}
              </View>
            </PremiumGuard>

            {/* Top categories - Same design as Dashboard */}
            <Text style={styles.sectionTitle}>TOP SPEND CATEGORIES</Text>
            <View style={styles.categoryCard}>
              {topCategories.length > 0 ? (
                (() => {
                  const maxAmount = topCategories.reduce((max, cat) => (cat.amount > max ? cat.amount : max), 0);
                  return topCategories.map((cat, idx) => {
                    const accentColor = `#${cat.color.toString(16).padStart(6, '0')}`;
                    const ratio = maxAmount > 0 ? cat.amount / maxAmount : 0;
                    return (
                      <React.Fragment key={cat.id}>
                        <View style={styles.categoryRow}>
                          <View style={styles.categoryLeft}>
                            <View style={styles.categoryRankBadge}>
                              <Text style={styles.categoryRankText}>{idx + 1}</Text>
                            </View>
                            <View style={[styles.categoryIconWrap, { backgroundColor: accentColor + '22' }]}>
                              <Ionicons name={resolveIcon(cat.icon, 'pricetag-outline')} size={14} color={accentColor} />
                            </View>
                            <View style={styles.categoryMeta}>
                              <Text style={styles.categoryName} numberOfLines={1}>{cat.name}</Text>
                              <View style={styles.categoryBarTrack}>
                                <View style={[styles.categoryBarFill, { width: `${Math.max(8, ratio * 100)}%`, backgroundColor: accentColor }]} />
                              </View>
                            </View>
                          </View>
                          <View style={styles.categoryRight}>
                            <MoneyText amount={cat.amount} currency={selectedCurrency} type="DR" weight="bold" style={styles.categoryAmount} showSign={false} />
                            <Text style={styles.categoryPercent}>{`${(ratio * 100).toFixed(0)}%`}</Text>
                          </View>
                        </View>
                        {idx < topCategories.length - 1 && <View style={styles.categoryDivider} />}
                      </React.Fragment>
                    );
                  });
                })()
              ) : (
                <EmptyState
                  title="No expense data"
                  description="Add expense transactions to see your top spending categories."
                  size="compact"
                  variant="inline"
                  fullHeight={false}
                />
              )}
            </View>

            {/* Top accounts */}
            <Text style={styles.sectionTitle}>TOP ACCOUNTS</Text>
            <View style={styles.listCard}>
              {accountBreakdown.length > 0 ? (
                accountBreakdown.map((acc, idx) => {
                  const accentColor = `#${acc.color.toString(16).padStart(6, '0')}`;
                  return (
                    <React.Fragment key={acc.accountId}>
                      <View style={styles.listRow}>
                        <View style={[styles.listIcon, { backgroundColor: accentColor + '20' }]}>
                          <Ionicons name={resolveIcon(acc.icon, 'wallet-outline')} size={16} color={accentColor} />
                        </View>
                        <View style={styles.listBody}>
                          <Text style={styles.listTitle}>{acc.name}</Text>
                        </View>
                        <MoneyText amount={acc.balance} currency={selectedCurrency} style={styles.listAmount} showSign={false} />
                      </View>
                      {idx < accountBreakdown.length - 1 && <View style={styles.listDivider} />}
                    </React.Fragment>
                  );
                })
              ) : (
                <EmptyState
                  title="No accounts"
                  description="Add accounts to see your balance breakdown."
                  size="compact"
                  variant="inline"
                  fullHeight={false}
                />
              )}
            </View>

            {/* Latest transactions */}
            <Text style={styles.sectionTitle}>LATEST TRANSACTIONS</Text>
            <View style={styles.listCard}>
              {latestTransactions.length > 0 ? (
                latestTransactions.map((tx, idx) => {
                  const accentColor = tx.category.color ? `#${tx.category.color.toString(16).padStart(6, '0')}` : colors.primary;
                  return (
                    <React.Fragment key={tx.id}>
                      <View style={styles.listRow}>
                        <View style={[styles.listIcon, { backgroundColor: accentColor + '20' }]}>
                          <Ionicons name={resolveIcon(tx.category.icon, 'swap-horizontal-outline')} size={16} color={accentColor} />
                        </View>
                        <View style={styles.listBody}>
                          <Text style={styles.listTitle}>{tx.note || tx.category.name}</Text>
                          <Text style={styles.listMeta}>
                            {tx.account.name} · {DAY_FORMATTER.format(new Date(tx.datetime))}
                          </Text>
                        </View>
                        <MoneyText amount={tx.amount} currency={selectedCurrency} type={tx.type} style={styles.listAmount} showSign={false} />
                      </View>
                      {idx < latestTransactions.length - 1 && <View style={styles.listDivider} />}
                    </React.Fragment>
                  );
                })
              ) : (
                <EmptyState
                  title="No transactions"
                  description="Add transactions to see your recent activity."
                  size="compact"
                  variant="inline"
                  fullHeight={false}
                />
              )}
            </View>
          </>
        )}

        {activeTab === 'weekly' && <WeeklyPanel currency={selectedCurrency} />}
        {activeTab === 'monthly' && <MonthlyPanel currency={selectedCurrency} />}

        {/* Report Type Buttons - Navigate to separate pages */}
        <View style={styles.reportsRow}>
          <TouchableOpacity 
            style={styles.reportButton} 
            onPress={() => router.push('/reports/weekly')} 
            activeOpacity={0.85}
          >
            <Ionicons name="calendar-outline" size={18} color={colors.text} />
            <Text style={styles.reportButtonText}>Weekly Report</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.reportButton} 
            onPress={() => router.push('/reports/monthly')} 
            activeOpacity={0.85}
          >
            <Ionicons name="book-outline" size={18} color={colors.text} />
            <Text style={styles.reportButtonText}>Monthly Report</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
});

const createStyles = (colors: ThemeColors, screenWidth: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: StatusBar.currentHeight,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },

    // Currency Picker
    currencyPickerContainer: {
      marginHorizontal: LAYOUT.screenPadding,
      marginBottom: spacing('3'),
    },
    currencyTabsRow: {
      flexDirection: 'row',
      gap: spacing('1'),
    },
    currencyTab: {
      paddingHorizontal: spacing('3'),
      paddingVertical: spacing('1'),
      borderRadius: radius('md'),
      backgroundColor: colors.card,
    },
    currencyTabActive: {
      backgroundColor: colors.text,
    },
    currencyTabText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 11,
      color: colors.textMuted,
    },
    currencyTabTextActive: {
      color: colors.background,
    },

    // Tabs - Segmented control style
    tabRow: {
      flexDirection: 'row',
      marginHorizontal: LAYOUT.screenPadding,
      marginBottom: spacing('4'),
      padding: 4,
      borderRadius: radius('2xl'),
      backgroundColor: colors.card,
    },
    tabPill: {
      flex: 1,
      height: 32,
      borderRadius: radius('xl'),
      justifyContent: 'center',
      alignItems: 'center',
    },
    tabPillActive: {
      backgroundColor: colors.surface,
    },
    tabPillText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 11,
      color: colors.textMuted,
    },
    tabPillTextActive: {
      color: colors.text,
    },

    // Content
    content: {
      paddingHorizontal: LAYOUT.screenPadding,
      paddingBottom: spacing('10'),
    },

    // Range selector - pill style
    rangeRow: {
      flexDirection: 'row',
      gap: spacing('2'),
      marginBottom: spacing('4'),
    },
    rangePill: {
      flex: 1,
      height: 32,
      borderRadius: radius('full'),
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      backgroundColor: colors.surface,
    },
    rangePillActive: {
      backgroundColor: colors.text,
    },
    rangePillLocked: {
      opacity: 0.5,
    },
    rangePillText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 11,
      color: colors.textMuted,
    },
    rangePillTextActive: {
      color: colors.background,
    },

    // Snapshot card
    snapshotCard: {
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
      padding: spacing('4'),
      marginBottom: spacing('6'),
    },
    snapshotTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing('2'),
    },
    snapshotKicker: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 1.5,
    },
    rangeBadge: {
      paddingHorizontal: spacing('2'),
      paddingVertical: spacing('0.5'),
      borderRadius: radius('sm'),
      backgroundColor: colors.card,
    },
    rangeBadgeText: {
      fontFamily: TYPOGRAPHY.fonts.bold,
      fontSize: 9,
      color: colors.textMuted,
      letterSpacing: 0.5,
    },
    snapshotAmount: {
      fontSize: 36,
      lineHeight: 42,
      letterSpacing: -1,
      marginBottom: spacing('4'),
    },
    snapshotStatsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      paddingTop: spacing('2'),
    },
    snapshotStat: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
    },
    snapshotDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    snapshotStatLabel: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 9,
      color: colors.textMuted,
      letterSpacing: 1,
      marginBottom: spacing('0.5'),
    },
    snapshotStatValue: {
      fontSize: 15,
    },
    snapshotStatDivider: {
      width: 1,
      height: 32,
      backgroundColor: colors.border,
    },

    // Section title
    sectionTitle: {
      fontFamily: TYPOGRAPHY.fonts.bold,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 2,
      marginBottom: spacing('3'),
      marginTop: spacing('6'),
    },

    // Chart
    chartCard: {
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
      padding: spacing('3'),
      marginBottom: spacing('2'),
      alignItems: 'center',
    },
    legendRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing('4'),
      marginBottom: spacing('3'),
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1'),
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendText: {
      fontFamily: TYPOGRAPHY.fonts.medium,
      fontSize: 11,
      color: colors.textMuted,
    },

    // Insights grid - evenly spaced
    insightsCard: {
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    insightRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    insightRowDivider: {
      height: 1,
      backgroundColor: colors.border,
    },
    insightCell: {
      flex: 1,
      paddingVertical: spacing('4'),
      paddingHorizontal: spacing('3'),
      alignItems: 'center',
    },
    insightDivider: {
      width: 1,
      height: 40,
      backgroundColor: colors.border,
    },
    insightLabel: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 9,
      color: colors.textMuted,
      letterSpacing: 1.5,
      marginBottom: spacing('2'),
    },
    insightValue: {
      fontFamily: TYPOGRAPHY.fonts.monoBold,
      fontSize: 18,
      color: colors.text,
    },

    // Delta
    deltaCard: {
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
      overflow: 'hidden',
      paddingVertical: spacing('2'),
    },
    deltaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3'),
    },
    deltaDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: spacing('4'),
    },
    deltaMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
    },
    deltaLabel: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 11,
      color: colors.text,
    },
    deltaValue: {
      fontFamily: TYPOGRAPHY.fonts.monoBold,
      fontSize: 16,
      color: colors.text,
    },

    // Lists
    listCard: {
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
      overflow: 'hidden',
      marginBottom: spacing('2'),
    },
    listRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing('4'),
      gap: spacing('3'),
    },
    listDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginLeft: spacing('4'),
    },
    listIcon: {
      width: 36,
      height: 36,
      borderRadius: radius('md'),
      justifyContent: 'center',
      alignItems: 'center',
    },
    listBody: {
      flex: 1,
    },
    listTitle: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 14,
      color: colors.text,
    },
    listMeta: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 11,
      color: colors.textMuted,
      marginTop: spacing('0.5'),
    },
    listAmount: {
      fontSize: 14,
    },

    // Categories - Same as Dashboard design
    categoryCard: {
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
      overflow: 'hidden',
      marginBottom: spacing('2'),
    },
    categoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing('3'),
      paddingHorizontal: spacing('3.5'),
      paddingVertical: spacing('2.5'),
    },
    categoryDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: spacing('3.5'),
    },
    categoryLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
    },
    categoryRankBadge: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
    },
    categoryRankText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      color: colors.textMuted,
      fontSize: 10,
    },
    categoryIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 9,
      justifyContent: 'center',
      alignItems: 'center',
    },
    categoryMeta: {
      flex: 1,
    },
    categoryName: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      color: colors.text,
      fontSize: 12,
      marginBottom: 5,
    },
    categoryBarTrack: {
      height: 4,
      borderRadius: 999,
      backgroundColor: colors.card,
      overflow: 'hidden',
    },
    categoryBarFill: {
      height: '100%',
      borderRadius: 999,
      minWidth: 8,
    },
    categoryRight: {
      minWidth: 88,
      alignItems: 'flex-end',
    },
    categoryAmount: {
      fontSize: 13,
      lineHeight: 15,
    },
    categoryPercent: {
      marginTop: 3,
      fontFamily: TYPOGRAPHY.fonts.regular,
      color: colors.textMuted,
      fontSize: 10,
    },

    // Reports Buttons
    reportsRow: {
      flexDirection: 'row',
      gap: spacing('3'),
      marginHorizontal: LAYOUT.screenPadding,
      marginTop: spacing('6'),
      marginBottom: spacing('8'),
    },
    reportButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing('2'),
      paddingVertical: spacing('3'),
      borderRadius: radius('lg'),
      backgroundColor: colors.surface,
    },
    reportButtonText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 13,
      color: colors.text,
    },
  });

export default StatsScreen;
