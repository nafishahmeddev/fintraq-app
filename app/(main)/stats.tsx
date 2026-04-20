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
import { BlurBackground } from '../../src/components/ui/BlurBackground';
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
import { LAYOUT, RADIUS, SPACING } from '../../src/theme/tokens';
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
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

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
  const styles = useMemo(() => createStyles(colors), [colors]);
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

  const cutoffDate = useMemo(() => {
    if (selectedRange === null) return null;
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (selectedRange - 1));
    return date;
  }, [selectedRange]);

  const filteredTransactions = useMemo(
    () =>
      (transactions ?? []).filter((tx) => {
        if (tx.account.currency !== selectedCurrency) return false;
        if (!cutoffDate) return true;
        return new Date(tx.datetime) >= cutoffDate;
      }),
    [transactions, selectedCurrency, cutoffDate],
  );

  const currencyAccounts = useMemo(
    () => (accounts ?? []).filter((a) => a.currency === selectedCurrency),
    [accounts, selectedCurrency],
  );

  const summary = useMemo(() => {
    const totals = computeFlow(filteredTransactions as { type: 'CR' | 'DR'; amount: number }[]);
    const balance = currencyAccounts.reduce((sum, a) => sum + a.balance, 0);
    const drCount = filteredTransactions.filter((tx) => tx.type === 'DR').length;
    const avgExpense = drCount > 0 ? totals.expense / drCount : 0;
    return { ...totals, balance, net: totals.income - totals.expense, count: filteredTransactions.length, avgExpense };
  }, [filteredTransactions, currencyAccounts]);

  const previousWindowTransactions = useMemo(() => {
    if (selectedRange === null || !cutoffDate) return [];
    const previousStart = new Date(cutoffDate);
    previousStart.setDate(previousStart.getDate() - selectedRange);
    return (transactions ?? []).filter((tx) => {
      if (tx.account.currency !== selectedCurrency) return false;
      const d = new Date(tx.datetime);
      return d >= previousStart && d < cutoffDate;
    });
  }, [transactions, selectedCurrency, selectedRange, cutoffDate]);

  const previousSummary = useMemo(() => {
    const totals = computeFlow(
      previousWindowTransactions as { type: 'CR' | 'DR'; amount: number }[],
    );
    return { ...totals, net: totals.income - totals.expense };
  }, [previousWindowTransactions]);

  const practicalMetrics = useMemo(() => {
    const expenseCount = filteredTransactions.filter((tx) => tx.type === 'DR').length;
    const coveredDays =
      selectedRange ??
      Math.max(
        1,
        Math.ceil(
          (Date.now() -
            new Date(filteredTransactions.at(-1)?.datetime ?? Date.now()).getTime()) /
            86400000,
        ),
      );
    const dailyBurn = coveredDays > 0 ? summary.expense / coveredDays : 0;
    const runwayDays = dailyBurn > 0 ? summary.balance / dailyBurn : null;
    const savingsRate = summary.income > 0 ? summary.net / summary.income : 0;
    const flowRatio = summary.expense > 0 ? summary.income / summary.expense : null;
    const largestExpense =
      filteredTransactions
        .filter((tx) => tx.type === 'DR')
        .sort((a, b) => b.amount - a.amount)[0] ?? null;
    return { coveredDays, dailyBurn, runwayDays, savingsRate, flowRatio, expenseCount, largestExpense };
  }, [filteredTransactions, selectedRange, summary]);

  const topCategories = useMemo(() => {
    const map = new Map<
      number,
      { id: number; name: string; icon: string | null; color: string; amount: number; count: number }
    >();
    filteredTransactions
      .filter((tx) => tx.type === 'DR')
      .forEach((tx) => {
        const color = tx.category.color
          ? `#${tx.category.color.toString(16).padStart(6, '0')}`
          : colors.primary;
        const cur = map.get(tx.category.id);
        if (cur) {
          cur.amount += tx.amount;
          cur.count += 1;
        } else {
          map.set(tx.category.id, {
            id: tx.category.id,
            name: tx.category.name,
            icon: tx.category.icon,
            color,
            amount: tx.amount,
            count: 1,
          });
        }
      });
    return Array.from(map.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [filteredTransactions, colors.primary]);

  const accountBreakdown = useMemo(() => {
    const total = currencyAccounts.reduce((sum, a) => sum + Math.max(a.balance, 0), 0);
    return currencyAccounts
      .map((a) => ({
        ...a,
        colorHex: `#${a.color.toString(16).padStart(6, '0')}`,
        share: total > 0 ? Math.max(a.balance, 0) / total : 0,
      }))
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5);
  }, [currencyAccounts]);

  const trendDays = useMemo(() => {
    const buckets = new Map<string, { date: Date; income: number; expense: number }>();
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setHours(0, 0, 0, 0);
      d.setDate(today.getDate() - i);
      buckets.set(d.toISOString().slice(0, 10), { date: d, income: 0, expense: 0 });
    }
    filteredTransactions.forEach((tx) => {
      const d = new Date(tx.datetime);
      d.setHours(0, 0, 0, 0);
      const bucket = buckets.get(d.toISOString().slice(0, 10));
      if (!bucket) return;
      if (tx.type === 'CR') bucket.income += tx.amount;
      else bucket.expense += tx.amount;
    });
    return Array.from(buckets.values());
  }, [filteredTransactions]);

  const trendMax = useMemo(
    () => Math.max(1, ...trendDays.flatMap((d) => [d.income, d.expense])),
    [trendDays],
  );

  const latestTransactions = useMemo(() => filteredTransactions.slice(0, 5), [filteredTransactions]);

  const comparison = useMemo(() => {
    if (selectedRange === null) return null;
    return {
      deltaIncome: summary.income - previousSummary.income,
      deltaExpense: summary.expense - previousSummary.expense,
      deltaNet: summary.net - previousSummary.net,
    };
  }, [selectedRange, summary, previousSummary]);

  // Chart data for 7-day flow bar chart
  const chartWidth = screenWidth - LAYOUT.screenPadding * 2 - SPACING['3.5'] * 2;
  const chartData = useMemo(
    () =>
      trendDays.flatMap((day, i) => [
        {
          value: day.income || 0,
          frontColor: colors.success,
          label: WEEKDAY_FORMATTER.format(day.date),
          labelTextStyle: {
            color: colors.textMuted,
            fontSize: 9,
            fontFamily: TYPOGRAPHY.fonts.semibold,
          },
          barBorderRadius: RADIUS.xs,
          spacing: 3,
        },
        {
          value: day.expense || 0,
          frontColor: colors.danger,
          barBorderRadius: RADIUS.xs,
          spacing: i < trendDays.length - 1 ? 14 : 3,
        },
      ]),
    [trendDays, colors],
  );

  // Memoised render arrays
  const topCategoriesRender = useMemo(() => {
    if (topCategories.length === 0) return null;
    return topCategories.map((cat, index) => {
      const width = summary.expense > 0 ? (cat.amount / summary.expense) * 100 : 0;
      return (
        <View
          key={cat.id}
          style={[styles.listRow, index === topCategories.length - 1 && styles.listRowLast]}
        >
          <View style={[styles.listIcon, { backgroundColor: cat.color + '18' }]}>
            <Ionicons name={resolveIcon(cat.icon, 'pricetag-outline')} size={16} color={cat.color} />
          </View>
          <View style={styles.listBody}>
            <View style={styles.listTopLine}>
              <Text style={styles.listTitle}>{cat.name}</Text>
              <MoneyText
                amount={cat.amount}
                currency={selectedCurrency}
                type="DR"
                style={styles.listAmount}
                weight="bold"
              />
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${width}%`, backgroundColor: cat.color }]}
              />
            </View>
            <Text style={styles.listMeta}>{cat.count} transactions</Text>
          </View>
        </View>
      );
    });
  }, [topCategories, summary.expense, selectedCurrency, styles]);

  const accountBreakdownRender = useMemo(() => {
    if (accountBreakdown.length === 0) return null;
    return accountBreakdown.map((account, index) => (
      <View
        key={account.id}
        style={[styles.listRow, index === accountBreakdown.length - 1 && styles.listRowLast]}
      >
        <View style={[styles.listIcon, { backgroundColor: account.colorHex + '18' }]}>
          <Ionicons
            name={resolveIcon(account.icon, 'wallet-outline')}
            size={16}
            color={account.colorHex}
          />
        </View>
        <View style={styles.listBody}>
          <View style={styles.listTopLine}>
            <Text style={styles.listTitle}>{account.name}</Text>
            <MoneyText
              amount={account.balance}
              currency={selectedCurrency}
              style={styles.listAmount}
              weight="bold"
            />
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${account.share * 100}%`, backgroundColor: account.colorHex },
              ]}
            />
          </View>
          <Text style={styles.listMeta}>{Math.round(account.share * 100)}% of tracked balance</Text>
        </View>
      </View>
    ));
  }, [accountBreakdown, selectedCurrency, styles]);

  const latestTransactionsRender = useMemo(() => {
    if (latestTransactions.length === 0) return null;
    return latestTransactions.map((tx, index) => {
      const accentColor = tx.category.color
        ? `#${tx.category.color.toString(16).padStart(6, '0')}`
        : colors.primary;
      return (
        <View
          key={tx.id}
          style={[styles.txRow, index === latestTransactions.length - 1 && styles.listRowLast]}
        >
          <View
            style={[
              styles.txAccent,
              { backgroundColor: tx.type === 'CR' ? colors.success : colors.danger },
            ]}
          />
          <View style={[styles.listIcon, { backgroundColor: accentColor + '18' }]}>
            <Ionicons
              name={resolveIcon(tx.category.icon, 'swap-horizontal-outline')}
              size={16}
              color={accentColor}
            />
          </View>
          <View style={styles.listBody}>
            <View style={styles.listTopLine}>
              <Text style={styles.listTitle}>{tx.note || tx.category.name}</Text>
              <MoneyText
                amount={tx.amount}
                currency={selectedCurrency}
                type={tx.type}
                style={styles.listAmount}
                weight="bold"
              />
            </View>
            <Text style={styles.listMeta}>
              {tx.account.name} · {DAY_FORMATTER.format(new Date(tx.datetime))}
            </Text>
          </View>
        </View>
      );
    });
  }, [latestTransactions, selectedCurrency, colors.primary, colors.success, colors.danger, styles]);

  if (txLoading || accountsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BlurBackground />

      <Header title="Stats" subtitle="Your financial insights" />

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        {TAB_OPTIONS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={[styles.tabPill, active && styles.tabPillActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabPillText, active && styles.tabPillTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && (
          <>
            {/* Currency + Range selectors */}
            <View style={styles.controlCard}>
              <Text style={styles.cardLabel}>CURRENCY</Text>
              <View style={styles.segmentRow}>
                {currencyKeys.map((currency) => {
                  const active = currency === selectedCurrency;
                  return (
                    <TouchableOpacity
                      key={currency}
                      style={[styles.segmentPill, active && styles.segmentPillActive]}
                      onPress={() => handleCurrencySelect(currency)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                        {currency}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.cardLabel, { marginTop: SPACING['3'] }]}>WINDOW</Text>
              <View style={styles.segmentRow}>
                {RANGE_OPTIONS.map((option) => {
                  const active = option.value === selectedRange;
                  const isLocked = !isPremium && option.value !== 7;
                  return (
                    <TouchableOpacity
                      key={option.label}
                      style={[
                        styles.segmentPill,
                        active && styles.segmentPillActive,
                        isLocked && styles.segmentPillLocked,
                      ]}
                      onPress={() => {
                        if (isLocked) navigateToPremium();
                        else handleRangeSelect(option.value);
                      }}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                        {option.label}
                      </Text>
                      {isLocked && (
                        <Ionicons
                          name="lock-closed"
                          size={10}
                          color={colors.textMuted}
                          style={styles.lockIcon}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Net position snapshot */}
            <View style={styles.snapshotCard}>
              <View style={styles.snapshotTopRow}>
                <View>
                  <Text style={styles.snapshotKicker}>NET POSITION</Text>
                  <MoneyText
                    amount={Math.abs(summary.net)}
                    currency={selectedCurrency}
                    type={summary.net >= 0 ? 'CR' : 'DR'}
                    style={styles.snapshotAmount}
                    weight="bold"
                  />
                </View>
                <View style={styles.rangeBadge}>
                  <Text style={styles.rangeBadgeText}>
                    {selectedRange === null ? 'ALL TIME' : `${selectedRange} DAYS`}
                  </Text>
                </View>
              </View>
              <View style={styles.snapshotGrid}>
                <View style={styles.snapshotCell}>
                  <Text style={styles.snapshotLabel}>INCOME</Text>
                  <MoneyText
                    amount={summary.income}
                    currency={selectedCurrency}
                    type="CR"
                    style={styles.snapshotValue}
                    weight="bold"
                  />
                </View>
                <View style={styles.snapshotCell}>
                  <Text style={styles.snapshotLabel}>EXPENSE</Text>
                  <MoneyText
                    amount={summary.expense}
                    currency={selectedCurrency}
                    type="DR"
                    style={styles.snapshotValue}
                    weight="bold"
                  />
                </View>
                <View style={styles.snapshotCell}>
                  <Text style={styles.snapshotLabel}>BALANCE</Text>
                  <MoneyText
                    amount={summary.balance}
                    currency={selectedCurrency}
                    style={styles.snapshotValue}
                    weight="bold"
                  />
                </View>
              </View>
            </View>

            {/* 7-day flow bar chart */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>7-DAY FLOW</Text>
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
            </View>
            <View style={styles.sectionCard}>
              <BarChart
                data={chartData}
                barWidth={10}
                height={90}
                maxValue={trendMax}
                noOfSections={3}
                yAxisThickness={0}
                xAxisThickness={0}
                hideYAxisText
                disableScroll
                width={chartWidth}
                isAnimated
                animationDuration={300}
                backgroundColor="transparent"
                xAxisColor="transparent"
                yAxisColor="transparent"
              />
            </View>

            {/* Practical insights */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>PRACTICAL INSIGHTS</Text>
              <Text style={styles.sectionHint}>{selectedCurrency}</Text>
            </View>
            <PremiumGuard label="Insights Pro" size="medium">
              <View style={styles.sectionCard}>
                <View style={styles.metricGrid}>
                  <View style={styles.metricCell}>
                    <Text style={styles.metricLabel}>AVG DAILY BURN</Text>
                    <MoneyText
                      amount={practicalMetrics.dailyBurn}
                      currency={selectedCurrency}
                      type="DR"
                      style={styles.metricValue}
                      weight="bold"
                    />
                  </View>
                  <View style={styles.metricCell}>
                    <Text style={styles.metricLabel}>SAVINGS RATE</Text>
                    <Text style={styles.metricPlainValue}>
                      {`${(practicalMetrics.savingsRate * 100).toFixed(1)}%`}
                    </Text>
                  </View>
                  <View style={styles.metricCell}>
                    <Text style={styles.metricLabel}>RUNWAY</Text>
                    <Text style={styles.metricPlainValue}>
                      {practicalMetrics.runwayDays === null
                        ? 'No burn'
                        : `${Math.max(0, practicalMetrics.runwayDays).toFixed(0)} days`}
                    </Text>
                  </View>
                  <View style={styles.metricCell}>
                    <Text style={styles.metricLabel}>IN/OUT RATIO</Text>
                    <Text style={styles.metricPlainValue}>
                      {practicalMetrics.flowRatio === null
                        ? 'N/A'
                        : `${practicalMetrics.flowRatio.toFixed(2)}x`}
                    </Text>
                  </View>
                </View>
              </View>
            </PremiumGuard>

            {/* Period delta */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>PERIOD DELTA</Text>
              <Text style={styles.sectionHint}>
                {selectedRange === null ? 'Unavailable for ALL' : `vs previous ${selectedRange}D`}
              </Text>
            </View>
            <PremiumGuard label="Comparison Pro" size="medium">
              <View style={styles.sectionCard}>
                {comparison ? (
                  <View style={styles.deltaList}>
                    <View style={styles.deltaRow}>
                      <View style={styles.deltaMeta}>
                        <Ionicons
                          name={comparison.deltaIncome >= 0 ? 'arrow-up' : 'arrow-down'}
                          size={14}
                          color={comparison.deltaIncome >= 0 ? colors.success : colors.danger}
                        />
                        <Text style={styles.deltaLabel}>INCOME</Text>
                      </View>
                      <MoneyText
                        amount={Math.abs(comparison.deltaIncome)}
                        currency={selectedCurrency}
                        type={comparison.deltaIncome >= 0 ? 'CR' : 'DR'}
                        style={styles.deltaValue}
                        weight="bold"
                      />
                    </View>
                    <View style={styles.deltaRow}>
                      <View style={styles.deltaMeta}>
                        <Ionicons
                          name={comparison.deltaExpense <= 0 ? 'arrow-down' : 'arrow-up'}
                          size={14}
                          color={comparison.deltaExpense <= 0 ? colors.success : colors.danger}
                        />
                        <Text style={styles.deltaLabel}>EXPENSE</Text>
                      </View>
                      <MoneyText
                        amount={Math.abs(comparison.deltaExpense)}
                        currency={selectedCurrency}
                        type={comparison.deltaExpense <= 0 ? 'CR' : 'DR'}
                        style={styles.deltaValue}
                        weight="bold"
                      />
                    </View>
                    <View style={styles.deltaRow}>
                      <View style={styles.deltaMeta}>
                        <Ionicons
                          name={comparison.deltaNet >= 0 ? 'trending-up' : 'trending-down'}
                          size={14}
                          color={comparison.deltaNet >= 0 ? colors.success : colors.danger}
                        />
                        <Text style={styles.deltaLabel}>NET</Text>
                      </View>
                      <MoneyText
                        amount={Math.abs(comparison.deltaNet)}
                        currency={selectedCurrency}
                        type={comparison.deltaNet >= 0 ? 'CR' : 'DR'}
                        style={styles.deltaValue}
                        weight="bold"
                      />
                    </View>
                  </View>
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

            {/* Top categories */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>TOP SPEND CATEGORIES</Text>
              <Text style={styles.sectionHint}>{topCategories.length} groups</Text>
            </View>
            <View style={styles.sectionCard}>
              {topCategoriesRender || (
                <EmptyState
                  icon="analytics-outline"
                  title="No spending data"
                  description={`Add expense transactions in ${selectedCurrency} to see categories.`}
                  size="compact"
                  variant="card"
                  fullHeight={false}
                />
              )}
            </View>

            {/* Account split */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>ACCOUNT SPLIT</Text>
              <Text style={styles.sectionHint}>{currencyAccounts.length} accounts</Text>
            </View>
            <View style={styles.sectionCard}>
              {accountBreakdownRender || (
                <EmptyState
                  icon="wallet-outline"
                  title="No accounts in this currency"
                  description={`Create an account in ${selectedCurrency} to view allocation.`}
                  size="compact"
                  variant="card"
                  fullHeight={false}
                />
              )}
            </View>

            {/* Recent transactions */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>RECENT TRANSACTIONS</Text>
              <Text style={styles.sectionHint}>{summary.count} items</Text>
            </View>
            <View style={styles.sectionCard}>
              {latestTransactionsRender || (
                <EmptyState
                  icon="receipt-outline"
                  title="No transactions in range"
                  description="Try switching the currency or widening the time range."
                  size="compact"
                  variant="card"
                  fullHeight={false}
                />
              )}
            </View>

            {/* Largest expense */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>LARGEST EXPENSE</Text>
              <Text style={styles.sectionHint}>{practicalMetrics.expenseCount} expense entries</Text>
            </View>
            <View style={styles.sectionCard}>
              {practicalMetrics.largestExpense ? (
                <View style={styles.highlightRow}>
                  <View style={[styles.listIcon, { backgroundColor: colors.danger + '1A' }]}>
                    <Ionicons
                      name={resolveIcon(
                        practicalMetrics.largestExpense.category.icon,
                        'pricetag-outline',
                      )}
                      size={16}
                      color={colors.danger}
                    />
                  </View>
                  <View style={styles.listBody}>
                    <View style={styles.listTopLine}>
                      <Text style={styles.listTitle} numberOfLines={1}>
                        {practicalMetrics.largestExpense.note ||
                          practicalMetrics.largestExpense.category.name}
                      </Text>
                      <MoneyText
                        amount={practicalMetrics.largestExpense.amount}
                        currency={selectedCurrency}
                        type="DR"
                        style={styles.listAmount}
                        weight="bold"
                      />
                    </View>
                    <Text style={styles.listMeta}>
                      {practicalMetrics.largestExpense.account.name} ·{' '}
                      {DATE_TIME_FORMATTER.format(
                        new Date(practicalMetrics.largestExpense.datetime),
                      )}
                    </Text>
                  </View>
                </View>
              ) : (
                <EmptyState
                  title="No expenses found"
                  description="No expense transactions in the selected range."
                  size="compact"
                  variant="inline"
                  fullHeight={false}
                />
              )}
            </View>
          </>
        )}

        {activeTab === 'weekly' && (
          <WeeklyPanel currency={selectedCurrency} />
        )}

        {activeTab === 'monthly' && (
          <MonthlyPanel currency={selectedCurrency} />
        )}
      </ScrollView>
    </View>
  );
});

export default StatsScreen;

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      overflow: 'hidden',
      paddingTop: StatusBar.currentHeight,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    tabRow: {
      flexDirection: 'row',
      gap: SPACING['2'],
      paddingHorizontal: LAYOUT.screenPadding,
      paddingBottom: SPACING['3'],
    },
    tabPill: {
      flex: 1,
      height: 34,
      borderRadius: RADIUS.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabPillActive: {
      backgroundColor: colors.text,
      borderColor: colors.text,
    },
    tabPillText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 0.8,
    },
    tabPillTextActive: {
      color: colors.background,
    },
    content: {
      paddingHorizontal: LAYOUT.screenPadding,
      paddingBottom: SPACING['11'],
    },
    controlCard: {
      padding: SPACING['4'],
      borderRadius: RADIUS.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: SPACING['3.5'],
    },
    snapshotCard: {
      padding: SPACING['4'],
      borderRadius: RADIUS.xl,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: SPACING['4'],
    },
    snapshotTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING['3.5'],
      gap: SPACING['3'],
    },
    snapshotKicker: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      color: colors.textMuted,
      fontSize: 9,
      letterSpacing: 1.4,
      marginBottom: SPACING['1.5'],
    },
    snapshotAmount: {
      fontSize: 32,
      lineHeight: 36,
      letterSpacing: -1,
    },
    rangeBadge: {
      height: 28,
      borderRadius: RADIUS.full,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: SPACING['3'],
      borderWidth: 1,
      borderColor: colors.border,
    },
    rangeBadgeText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      color: colors.textMuted,
      fontSize: 10,
      letterSpacing: 1,
    },
    cardLabel: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      color: colors.textMuted,
      fontSize: 10,
      letterSpacing: 1.2,
      marginBottom: SPACING['2'],
    },
    segmentRow: {
      flexDirection: 'row',
      gap: SPACING['2'],
      flexWrap: 'wrap',
    },
    segmentPill: {
      minWidth: 52,
      height: 34,
      paddingHorizontal: SPACING['3'],
      borderRadius: RADIUS.full,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: SPACING['1'],
      borderWidth: 1,
      borderColor: colors.border,
    },
    segmentPillActive: {
      backgroundColor: colors.text,
      borderColor: colors.text,
    },
    segmentPillLocked: {
      opacity: 0.6,
    },
    segmentText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      color: colors.textMuted,
      fontSize: 11,
      letterSpacing: 0.6,
    },
    segmentTextActive: {
      color: colors.background,
    },
    lockIcon: {
      marginLeft: SPACING['0.5'],
    },
    snapshotGrid: {
      flexDirection: 'row',
      gap: SPACING['2'],
    },
    snapshotCell: {
      flex: 1,
      minHeight: 78,
      borderRadius: RADIUS.md,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      padding: SPACING['2.5'],
      justifyContent: 'space-between',
    },
    snapshotLabel: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      color: colors.textMuted,
      fontSize: 9,
      letterSpacing: 1,
    },
    snapshotValue: {
      fontSize: 14,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: SPACING['3.5'],
      marginBottom: SPACING['3'],
    },
    sectionTitle: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      color: colors.text,
      fontSize: 10,
      letterSpacing: 1.2,
    },
    sectionHint: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      color: colors.textMuted,
      fontSize: 11,
    },
    sectionCard: {
      borderRadius: RADIUS.lg,
      backgroundColor: colors.surface,
      padding: SPACING['3.5'],
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: SPACING['5'],
    },
    metricGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING['2.5'],
    },
    metricCell: {
      width: '47%',
      minHeight: 74,
      borderRadius: RADIUS.md,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      padding: SPACING['2.5'],
      justifyContent: 'space-between',
    },
    metricLabel: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      color: colors.textMuted,
      fontSize: 9,
      letterSpacing: 1,
    },
    metricValue: {
      fontSize: 13,
    },
    metricPlainValue: {
      fontFamily: TYPOGRAPHY.fonts.amountBold,
      color: colors.text,
      fontSize: 14,
    },
    deltaList: {
      gap: SPACING['2.5'],
    },
    deltaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.background,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: SPACING['2.5'],
      paddingHorizontal: SPACING['3'],
    },
    deltaMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING['1.5'],
    },
    deltaLabel: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      color: colors.textMuted,
      fontSize: 11,
      letterSpacing: 0.8,
    },
    deltaValue: {
      fontSize: 13,
    },
    legendRow: {
      flexDirection: 'row',
      gap: SPACING['3.5'],
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING['1.5'],
    },
    legendDot: {
      width: 7,
      height: 7,
      borderRadius: 7,
    },
    legendText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      color: colors.textMuted,
      fontSize: 10,
      letterSpacing: 0.5,
    },
    listRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING['3'],
      borderBottomWidth: 1,
      borderBottomColor: colors.background,
      gap: SPACING['3'],
    },
    listRowLast: {
      borderBottomWidth: 0,
    },
    listIcon: {
      width: 36,
      height: 36,
      borderRadius: RADIUS.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listBody: {
      flex: 1,
    },
    listTopLine: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING['1'],
    },
    listTitle: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      color: colors.text,
      fontSize: 14,
    },
    listAmount: {
      fontSize: 14,
    },
    progressTrack: {
      height: 4,
      backgroundColor: colors.background,
      borderRadius: RADIUS.xs,
      overflow: 'hidden',
      marginBottom: SPACING['1'],
    },
    progressFill: {
      height: '100%',
      borderRadius: RADIUS.xs,
    },
    listMeta: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      color: colors.textMuted,
      fontSize: 11,
    },
    txRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING['3'],
      borderBottomWidth: 1,
      borderBottomColor: colors.background,
      gap: SPACING['3'],
      position: 'relative',
    },
    txAccent: {
      position: 'absolute',
      left: -SPACING['3.5'],
      top: SPACING['3.5'],
      bottom: SPACING['3.5'],
      width: 3,
      borderRadius: 2,
    },
    highlightRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING['3'],
    },
  });
