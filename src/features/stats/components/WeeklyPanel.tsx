import { resolveIcon } from '@/src/utils/icons';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Header } from '../../../components/ui/Header';
import { MoneyText } from '../../../components/ui/MoneyText';
import { useWeeklyReport } from '../../reports/hooks/useReports';
import { useAccounts } from '../../accounts/hooks/accounts';
import { useTransactions } from '../../transactions/hooks/transactions';
import { useTheme } from '../../../providers/ThemeProvider';
import { ThemeColors } from '../../../theme/colors';
import { LAYOUT, RADIUS, SPACING } from '../../../theme/tokens';
import { TYPOGRAPHY } from '../../../theme/typography';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { useWindowDimensions } from 'react-native';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';

type Props = { currency: string };

export const WeeklyPanel = React.memo(function WeeklyPanel({ currency }: Props) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const styles = useMemo(() => createStyles(colors, screenWidth), [colors, screenWidth]);
  const { data: report, isLoading } = useWeeklyReport(currency);
  const { data: accounts } = useAccounts();
  const { data: transactions } = useTransactions();

  // Get accounts for this currency
  const currencyAccounts = useMemo(() => {
    return (accounts || []).filter(a => a.currency === currency);
  }, [accounts, currency]);

  // Get weekly transactions
  const weeklyTransactions = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
    return (transactions || []).filter(t => {
      const tDate = new Date(t.datetime);
      return tDate >= weekStart && tDate <= weekEnd && t.account.currency === currency;
    });
  }, [transactions, currency]);

  // Calculate account breakdown for the week
  const accountBreakdown = useMemo(() => {
    return currencyAccounts.map(account => {
      const accountTransactions = weeklyTransactions.filter(t => t.accountId === account.id);
      const income = accountTransactions.filter(t => t.type === 'CR').reduce((s, t) => s + t.amount, 0);
      const expense = accountTransactions.filter(t => t.type === 'DR').reduce((s, t) => s + t.amount, 0);
      return {
        ...account,
        weekIncome: income,
        weekExpense: expense,
        weekNet: income - expense,
      };
    }).filter(a => a.weekIncome > 0 || a.weekExpense > 0).sort((a, b) => b.weekNet - a.weekNet);
  }, [currencyAccounts, weeklyTransactions]);

  // 7-day trend data — spacing per item prevents horizontal overlap
  const { chartData, trendMax } = useMemo(() => {
    const days: Record<string, { income: number; expense: number; date: Date }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const key = format(d, 'yyyy-MM-dd');
      days[key] = { income: 0, expense: 0, date: d };
    }
    weeklyTransactions.forEach((t) => {
      const key = format(new Date(t.datetime), 'yyyy-MM-dd');
      if (days[key]) {
        if (t.type === 'CR') days[key].income += t.amount;
        else days[key].expense += t.amount;
      }
    });
    const entries = Object.entries(days).sort((a, b) => a[0].localeCompare(b[0]));
    // barWidth=14, innerSpacing=3 → labelWidth=31 centers label under pair
    const INNER_SPACING = 3;
    const BAR_W = 14;
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
        label: format(vals.date, 'EEE'),
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
        spacing: i < entries.length - 1 ? 16 : 4,
      });
    });
    const maxVal = Math.max(...data.map((d) => d.value), 1);
    return { chartData: data, trendMax: maxVal * 1.1 };
  }, [weeklyTransactions, colors.success, colors.danger, colors.textMuted]);

  // Pie chart data — service already returns color as hex string
  const pieData = useMemo(() => {
    if (!report?.topCategories?.length) return [];
    const total = report.topCategories.reduce((sum, cat) => sum + cat.amount, 0);
    if (total === 0) return [];
    return report.topCategories.slice(0, 5).map((cat) => {
      const percentage = Math.round((cat.amount / total) * 100);
      return { value: cat.amount, color: cat.color, percentage, name: cat.name };
    });
  }, [report]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!report) return null;

  const isHealthy = report.savingsRate >= 20;
  const maxCategoryAmount = report.topCategories.reduce((max, cat) => Math.max(max, cat.amount), 0);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Hero Summary */}
      <View style={styles.heroCard}>
        <Text style={styles.heroKicker}>WEEKLY RECAP</Text>
        <Text style={styles.heroTitle}>{isHealthy ? 'Optimal Flow' : 'Tight Margins'}</Text>
        <Text style={styles.heroSubtitle}>
          {format(subDays(new Date(), 6), 'MMM d')} - {format(new Date(), 'MMM d, yyyy')}
        </Text>
        
        <View style={styles.netRow}>
          <View>
            <Text style={styles.netLabel}>NET POSITION</Text>
            <MoneyText
              amount={Math.abs(report.netPosition)}
              currency={currency}
              type={report.netPosition >= 0 ? 'CR' : 'DR'}
              style={styles.netAmount}
              weight="bold"
              showSign={false}
            />
          </View>
          <View style={styles.divider} />
          <View>
            <Text style={styles.netLabel}>SAVINGS RATE</Text>
            <Text style={styles.savingsRate}>{report.savingsRate.toFixed(1)}%</Text>
          </View>
        </View>
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <View style={[styles.metricDot, { backgroundColor: colors.success }]} />
          <Text style={styles.metricLabel}>INCOME</Text>
          <MoneyText
            amount={report.totalIncome}
            currency={currency}
            type="CR"
            style={styles.metricValue}
            showSign={false}
          />
        </View>
        <View style={styles.metricCard}>
          <View style={[styles.metricDot, { backgroundColor: colors.danger }]} />
          <Text style={styles.metricLabel}>EXPENSE</Text>
          <MoneyText
            amount={report.totalExpense}
            currency={currency}
            type="DR"
            style={styles.metricValue}
            showSign={false}
          />
        </View>
      </View>

      {/* 7-Day Trend Chart */}
      <Text style={styles.sectionTitle}>7-DAY TREND</Text>
      <View style={styles.chartCard}>
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
        {chartData.length > 0 ? (
          <BarChart
            data={chartData}
            barWidth={14}
            height={160}
            maxValue={trendMax}
            noOfSections={3}
            yAxisThickness={0}
            yAxisLabelWidth={0}
            xAxisThickness={1}
            xAxisColor={colors.border}
            hideYAxisText
            disableScroll
            width={screenWidth - LAYOUT.screenPadding * 2 - SPACING['4'] * 2}
            isAnimated
            animationDuration={400}
            backgroundColor="transparent"
          />
        ) : (
          <EmptyState
            icon="bar-chart-outline"
            title="No data"
            description="No transactions to display."
            size="compact"
            variant="inline"
            fullHeight={false}
          />
        )}
      </View>

      {/* Category Distribution Pie Chart */}
      {pieData.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>CATEGORY DISTRIBUTION</Text>
          <View style={styles.pieCard}>
            <PieChart
              data={pieData}
              donut
              showText
              textColor={colors.text}
              textSize={10}
              focusOnPress
              sectionAutoFocus
              radius={80}
              innerRadius={45}
              innerCircleColor={colors.surface}
              centerLabelComponent={() => (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 10, color: colors.textMuted, fontFamily: TYPOGRAPHY.fonts.regular }}>Total</Text>
                  <MoneyText 
                    amount={report.topCategories.reduce((sum, cat) => sum + cat.amount, 0)}
                    currency={currency}
                    style={{ fontSize: 14, fontFamily: TYPOGRAPHY.fonts.amountBold }}
                    showSign={false}
                  />
                </View>
              )}
            />
            <View style={styles.pieLegend}>
              {pieData.map((item, idx) => (
                <View key={idx} style={styles.pieLegendItem}>
                  <View style={[styles.pieLegendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.pieLegendText} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.pieLegendPercent}>{item.percentage}%</Text>
                </View>
              ))}
            </View>
          </View>
        </>
      )}

      {/* Account Breakdown */}
      <Text style={styles.sectionTitle}>ACCOUNTS THIS WEEK</Text>
      <View style={styles.accountsCard}>
        {accountBreakdown.length > 0 ? (
          accountBreakdown.map((account, idx) => {
            const accentColor = `#${account.color.toString(16).padStart(6, '0')}`;
            return (
              <React.Fragment key={account.id}>
                <View style={styles.accountRow}>
                  <View style={[styles.accountIcon, { backgroundColor: accentColor + '20' }]}>
                    <Ionicons name={resolveIcon(account.icon, 'wallet-outline')} size={16} color={accentColor} />
                  </View>
                  <View style={styles.accountMeta}>
                    <Text style={styles.accountName} numberOfLines={1}>{account.name}</Text>
                    <View style={styles.accountStats}>
                      {account.weekIncome > 0 && (
                        <Text style={[styles.accountStatText, { color: colors.success }]}>
                          +{account.weekIncome.toFixed(0)}
                        </Text>
                      )}
                      {account.weekExpense > 0 && (
                        <Text style={[styles.accountStatText, { color: colors.danger }]}>
                          -{account.weekExpense.toFixed(0)}
                        </Text>
                      )}
                    </View>
                  </View>
                  <MoneyText
                    amount={account.balance}
                    currency={currency}
                    style={styles.accountBalance}
                    showSign={false}
                  />
                </View>
                {idx < accountBreakdown.length - 1 && <View style={styles.accountDivider} />}
              </React.Fragment>
            );
          })
        ) : (
          <EmptyState
            icon="wallet-outline"
            title="No account activity"
            description="No transactions on your accounts this week."
            size="compact"
            variant="inline"
            fullHeight={false}
          />
        )}
      </View>

      {/* Comparison */}
      {report.comparison && (
        <>
          <Text style={styles.sectionTitle}>VS LAST WEEK</Text>
          <View style={styles.comparisonCard}>
            <View style={styles.comparisonRow}>
              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>Expense</Text>
                <Text
                  style={[
                    styles.comparisonValue,
                    { color: report.comparison.expenseChange > 0 ? colors.danger : colors.success },
                  ]}
                >
                  {report.comparison.expenseChange > 0 ? '+' : ''}
                  {report.comparison.expenseChange.toFixed(1)}%
                </Text>
              </View>
              <View style={styles.comparisonDivider} />
              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>Income</Text>
                <Text
                  style={[
                    styles.comparisonValue,
                    { color: report.comparison.incomeChange >= 0 ? colors.success : colors.danger },
                  ]}
                >
                  {report.comparison.incomeChange >= 0 ? '+' : ''}
                  {report.comparison.incomeChange.toFixed(1)}%
                </Text>
              </View>

            </View>
          </View>
        </>
      )}

      {/* Category Breakdown */}
      <Text style={styles.sectionTitle}>TOP CATEGORIES</Text>
      <View style={styles.categoryCard}>
        {report.topCategories.length > 0 ? (
          report.topCategories.map((cat, idx) => {
            const accentColor = cat.color;
            const ratio = maxCategoryAmount > 0 ? cat.amount / maxCategoryAmount : 0;
            return (
              <React.Fragment key={cat.id}>
                <View style={styles.categoryRow}>
                  <View style={styles.categoryLeft}>
                    <View style={[styles.categoryIcon, { backgroundColor: accentColor + '20' }]}>
                      <Ionicons name={resolveIcon(cat.icon, 'pricetag-outline')} size={14} color={accentColor} />
                    </View>
                    <View style={styles.categoryMeta}>
                      <Text style={styles.categoryName} numberOfLines={1}>{cat.name}</Text>
                      <View style={styles.categoryBarBg}>
                        <View style={[styles.categoryBarFill, { width: `${Math.max(4, ratio * 100)}%`, backgroundColor: accentColor }]} />
                      </View>
                    </View>
                  </View>
                  <View style={styles.categoryRight}>
                    <MoneyText amount={cat.amount} currency={currency} type="DR" style={styles.categoryAmount} showSign={false} />
                    <Text style={styles.categoryPercent}>{cat.percentage.toFixed(0)}%</Text>
                  </View>
                </View>
                {idx < report.topCategories.length - 1 && <View style={styles.categoryDivider} />}
              </React.Fragment>
            );
          })
        ) : (
          <EmptyState
            icon="calendar-outline"
            title="No activity this week"
            description="Log transactions to see your weekly breakdown."
            size="compact"
            variant="inline"
            fullHeight={false}
          />
        )}
      </View>

      {/* Weekly Insights */}
      <Text style={styles.sectionTitle}>KEY INSIGHTS</Text>
      <View style={styles.insightsCard}>
        <View style={styles.insightRow}>
          <View style={styles.insightItem}>
            <Text style={styles.insightLabel}>AVG DAILY SPEND</Text>
            <Text style={styles.insightValueMono}>
              {(report.totalExpense / 7).toFixed(0)} {currency}
            </Text>
          </View>
          <View style={styles.insightDivider} />
          <View style={styles.insightItem}>
            <Text style={styles.insightLabel}>BUSIEST DAY</Text>
            <Text style={styles.insightValueMono}>
              {chartData.reduce((max, d, i) => d.value > max.value ? {value: d.value, idx: i} : max, {value: 0, idx: 0}).idx < 14 
                ? format(subDays(new Date(), 6 - Math.floor(chartData.findIndex(d => d.value === Math.max(...chartData.filter((_,i) => i%2===0).map(d => d.value))) / 2)), 'EEE')
                : '—'}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
});

const createStyles = (colors: ThemeColors, screenWidth: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingBottom: SPACING['10'],
    },
    heroCard: {
      borderRadius: RADIUS.xl,
      backgroundColor: colors.surface,
      padding: SPACING['5'],
      marginBottom: SPACING['4'],
      marginHorizontal: LAYOUT.screenPadding,
    },
    heroKicker: {
      fontFamily: TYPOGRAPHY.fonts.bold,
      fontSize: 10,
      color: colors.primary,
      letterSpacing: 2,
      marginBottom: SPACING['2'],
    },
    heroTitle: {
      fontFamily: TYPOGRAPHY.fonts.heading,
      fontSize: 28,
      color: colors.text,
      letterSpacing: -1,
      marginBottom: SPACING['1'],
    },
    heroSubtitle: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
      marginBottom: SPACING['4'],
    },
    netRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING['4'],
      paddingTop: SPACING['3'],
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    divider: {
      width: 1,
      height: 40,
      backgroundColor: colors.border,
    },
    netLabel: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 9,
      color: colors.textMuted,
      letterSpacing: 1.5,
      marginBottom: SPACING['1'],
    },
    netAmount: {
      fontSize: 24,
    },
    savingsRate: {
      fontFamily: TYPOGRAPHY.fonts.monoBold,
      fontSize: 24,
      color: colors.text,
    },
    metricsRow: {
      flexDirection: 'row',
      gap: SPACING['3'],
      marginBottom: SPACING['4'],
      marginHorizontal: LAYOUT.screenPadding,
    },
    metricCard: {
      flex: 1,
      borderRadius: RADIUS.lg,
      backgroundColor: colors.surface,
      padding: SPACING['4'],
    },
    metricDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginBottom: SPACING['2'],
    },
    metricLabel: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 9,
      color: colors.textMuted,
      letterSpacing: 1,
      marginBottom: SPACING['1'],
    },
    metricValue: {
      fontSize: 18,
    },
    sectionTitle: {
      fontFamily: TYPOGRAPHY.fonts.bold,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 2,
      marginBottom: SPACING['3'],
      marginTop: SPACING['4'],
      marginHorizontal: LAYOUT.screenPadding,
    },
    chartCard: {
      borderRadius: RADIUS.xl,
      backgroundColor: colors.surface,
      padding: SPACING['4'],
      marginBottom: SPACING['2'],
      marginHorizontal: LAYOUT.screenPadding,
      alignItems: 'center',
    },
    legendRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: SPACING['4'],
      marginBottom: SPACING['3'],
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING['1'],
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
    accountsCard: {
      borderRadius: RADIUS.xl,
      backgroundColor: colors.surface,
      overflow: 'hidden',
      marginHorizontal: LAYOUT.screenPadding,
      marginBottom: SPACING['2'],
    },
    accountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING['4'],
      paddingVertical: SPACING['3'],
      gap: SPACING['3'],
    },
    accountDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginLeft: SPACING['4'],
    },
    accountIcon: {
      width: 36,
      height: 36,
      borderRadius: RADIUS.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    accountMeta: {
      flex: 1,
    },
    accountName: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 14,
      color: colors.text,
      marginBottom: 2,
    },
    accountStats: {
      flexDirection: 'row',
      gap: SPACING['2'],
    },
    accountStatText: {
      fontFamily: TYPOGRAPHY.fonts.mono,
      fontSize: 11,
    },
    accountBalance: {
      fontSize: 14,
    },
    comparisonCard: {
      borderRadius: RADIUS.lg,
      backgroundColor: colors.surface,
      padding: SPACING['4'],
      marginHorizontal: LAYOUT.screenPadding,
      marginBottom: SPACING['2'],
    },
    comparisonRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    comparisonItem: {
      flex: 1,
      alignItems: 'center',
    },
    comparisonDivider: {
      width: 1,
      height: 32,
      backgroundColor: colors.border,
    },
    comparisonLabel: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 9,
      color: colors.textMuted,
      letterSpacing: 1,
      marginBottom: SPACING['1'],
    },
    comparisonValue: {
      fontFamily: TYPOGRAPHY.fonts.monoBold,
      fontSize: 18,
    },
    categoryCard: {
      borderRadius: RADIUS.xl,
      backgroundColor: colors.surface,
      overflow: 'hidden',
      marginHorizontal: LAYOUT.screenPadding,
      marginBottom: SPACING['2'],
    },
    categoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING['4'],
      paddingVertical: SPACING['3'],
    },
    categoryDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: SPACING['4'],
    },
    categoryLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING['3'],
    },
    categoryIcon: {
      width: 32,
      height: 32,
      borderRadius: RADIUS.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    categoryMeta: {
      flex: 1,
    },
    categoryName: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 13,
      color: colors.text,
      marginBottom: 4,
    },
    categoryBarBg: {
      height: 3,
      backgroundColor: colors.card,
      borderRadius: 2,
      overflow: 'hidden',
    },
    categoryBarFill: {
      height: '100%',
      borderRadius: 2,
    },
    categoryRight: {
      alignItems: 'flex-end',
      minWidth: 80,
    },
    categoryAmount: {
      fontSize: 13,
    },
    categoryPercent: {
      fontFamily: TYPOGRAPHY.fonts.mono,
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 2,
    },
    insightsCard: {
      borderRadius: RADIUS.xl,
      backgroundColor: colors.surface,
      marginHorizontal: LAYOUT.screenPadding,
      padding: SPACING['3'],
    },
    insightRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    insightItem: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: SPACING['2'],
    },
    insightDivider: {
      width: 1,
      height: 36,
      backgroundColor: colors.border,
    },
    insightLabel: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 9,
      color: colors.textMuted,
      letterSpacing: 1.5,
      marginBottom: SPACING['1'],
    },
    insightValueMono: {
      fontFamily: TYPOGRAPHY.fonts.monoBold,
      fontSize: 16,
      color: colors.text,
    },
    pieCard: {
      borderRadius: RADIUS.xl,
      backgroundColor: colors.surface,
      padding: SPACING['4'],
      marginHorizontal: LAYOUT.screenPadding,
      marginBottom: SPACING['4'],
      alignItems: 'center',
    },
    pieLegend: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: SPACING['2'],
      marginTop: SPACING['4'],
    },
    pieLegendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING['1'],
      paddingHorizontal: SPACING['2'],
      paddingVertical: SPACING['1'],
      borderRadius: RADIUS.sm,
      backgroundColor: colors.card,
    },
    pieLegendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    pieLegendText: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 11,
      color: colors.text,
    },
    pieLegendPercent: {
      fontFamily: TYPOGRAPHY.fonts.mono,
      fontSize: 10,
      color: colors.textMuted,
    },
  });
