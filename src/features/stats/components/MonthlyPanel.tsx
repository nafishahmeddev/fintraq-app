import { resolveIcon } from '@/src/utils/icons';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Header } from '../../../components/ui/Header';
import { MoneyText } from '../../../components/ui/MoneyText';
import { useMonthlyReport } from '../../reports/hooks/useReports';
import { useAccounts } from '../../accounts/hooks/accounts';
import { useTransactions } from '../../transactions/hooks/transactions';
import { useTheme } from '../../../providers/ThemeProvider';
import { ThemeColors } from '../../../theme/colors';
import { LAYOUT, RADIUS, SPACING } from '../../../theme/tokens';
import { TYPOGRAPHY } from '../../../theme/typography';
import { BarChart } from 'react-native-gifted-charts';
import { useWindowDimensions } from 'react-native';
import { format, startOfMonth, endOfMonth, eachWeekOfInterval, subMonths, isSameMonth } from 'date-fns';

type Props = { currency: string };

export const MonthlyPanel = React.memo(function MonthlyPanel({ currency }: Props) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const styles = useMemo(() => createStyles(colors, screenWidth), [colors, screenWidth]);
  const { data: report, isLoading } = useMonthlyReport(currency);
  const { data: accounts } = useAccounts();
  const { data: transactions } = useTransactions();

  // Get accounts for this currency
  const currencyAccounts = useMemo(() => {
    return (accounts || []).filter(a => a.currency === currency);
  }, [accounts, currency]);

  // Get monthly transactions
  const monthlyTransactions = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());
    return (transactions || []).filter(t => {
      const tDate = new Date(t.datetime);
      return tDate >= monthStart && tDate <= monthEnd && t.account.currency === currency;
    });
  }, [transactions, currency]);

  // Calculate account breakdown for the month
  const accountBreakdown = useMemo(() => {
    return currencyAccounts.map(account => {
      const accountTransactions = monthlyTransactions.filter(t => t.accountId === account.id);
      const income = accountTransactions.filter(t => t.type === 'CR').reduce((s, t) => s + t.amount, 0);
      const expense = accountTransactions.filter(t => t.type === 'DR').reduce((s, t) => s + t.amount, 0);
      return {
        ...account,
        monthIncome: income,
        monthExpense: expense,
        monthNet: income - expense,
      };
    }).filter(a => a.monthIncome > 0 || a.monthExpense > 0).sort((a, b) => b.monthNet - a.monthNet);
  }, [currencyAccounts, monthlyTransactions]);

  // Weekly trend data for the month
  const { chartData, trendMax } = useMemo(() => {
    const weeks = eachWeekOfInterval({
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date()),
    }, { weekStartsOn: 1 });
    
    const data: {
      value: number;
      frontColor: string;
      label: string;
      labelTextStyle?: object;
      labelWidth?: number;
      barBorderRadius?: number;
      spacing?: number;
    }[] = [];
    
    // barWidth=20, innerSpacing=4 → labelWidth=44 centers label under pair
    const INNER_SPACING = 4;
    const BAR_W = 20;
    const labelStyle = { color: colors.textMuted, fontSize: 9, fontFamily: TYPOGRAPHY.fonts.semibold };
    weeks.forEach((weekStart, idx) => {
      const weekEnd = endOfMonth(new Date()) < new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
        ? endOfMonth(new Date())
        : new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      const weekTransactions = monthlyTransactions.filter(t => {
        const tDate = new Date(t.datetime);
        return tDate >= weekStart && tDate <= weekEnd;
      });
      const income = weekTransactions.filter(t => t.type === 'CR').reduce((s, t) => s + t.amount, 0);
      const expense = weekTransactions.filter(t => t.type === 'DR').reduce((s, t) => s + t.amount, 0);
      data.push({
        value: income,
        frontColor: colors.success,
        label: `W${idx + 1}`,
        labelTextStyle: labelStyle,
        labelWidth: BAR_W * 2 + INNER_SPACING,
        barBorderRadius: 6,
        spacing: INNER_SPACING,
      });
      data.push({
        value: expense,
        frontColor: colors.danger,
        label: '',
        barBorderRadius: 6,
        spacing: idx < weeks.length - 1 ? 20 : INNER_SPACING,
      });
    });
    
    const maxVal = Math.max(...data.map((d) => d.value), 1);
    return { chartData: data, trendMax: maxVal * 1.1 };
  }, [monthlyTransactions, colors.success, colors.danger]);

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
        <Text style={styles.heroKicker}>MONTHLY AUDIT</Text>
        <Text style={styles.heroTitle}>{isHealthy ? 'Solid Accumulation' : 'Increased Burn'}</Text>
        <Text style={styles.heroSubtitle}>{report.periodLabel}</Text>
        
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

      {/* Key Metrics - 4 metrics in 2x2 grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={[styles.metricDot, { backgroundColor: colors.success }]} />
          <Text style={styles.metricLabel}>REVENUE</Text>
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
        <View style={styles.metricCard}>
          <View style={[styles.metricDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.metricLabel}>BALANCE</Text>
          <MoneyText
            amount={report.netPosition}
            currency={currency}
            style={styles.metricValue}
            showSign={false}
          />
        </View>
        <View style={styles.metricCard}>
          <View style={[styles.metricDot, { backgroundColor: colors.warning }]} />
          <Text style={styles.metricLabel}>SAVINGS %</Text>
          <Text style={styles.metricValuePlain}>{report.savingsRate.toFixed(1)}%</Text>
        </View>
      </View>

      {/* Weekly Trend Chart */}
      <Text style={styles.sectionTitle}>WEEKLY BREAKDOWN</Text>
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
        <BarChart
          data={chartData}
          barWidth={20}
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
      </View>

      {/* Account Breakdown */}
      <Text style={styles.sectionTitle}>ACCOUNTS THIS MONTH</Text>
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
                      {account.monthIncome > 0 && (
                        <Text style={[styles.accountStatText, { color: colors.success }]}>
                          +{account.monthIncome.toFixed(0)}
                        </Text>
                      )}
                      {account.monthExpense > 0 && (
                        <Text style={[styles.accountStatText, { color: colors.danger }]}>
                          -{account.monthExpense.toFixed(0)}
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
            description="No transactions on your accounts this month."
            size="compact"
            variant="inline"
            fullHeight={false}
          />
        )}
      </View>

      {/* Category Breakdown */}
      <Text style={styles.sectionTitle}>DOMINANT SECTORS</Text>
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
            icon="pie-chart-outline"
            title="No category data"
            description="Add transactions with categories to see your monthly breakdown."
            size="compact"
            variant="inline"
            fullHeight={false}
          />
        )}
      </View>

      {/* Monthly Insights */}
      <Text style={styles.sectionTitle}>KEY INSIGHTS</Text>
      <View style={styles.insightsCard}>
        <View style={styles.insightRow}>
          <View style={styles.insightItem}>
            <Text style={styles.insightLabel}>DAILY AVG</Text>
            <Text style={styles.insightValueMono}>
              {(report.totalExpense / 30).toFixed(0)} {currency}
            </Text>
          </View>
          <View style={styles.insightDivider} />
          <View style={styles.insightItem}>
            <Text style={styles.insightLabel}>TRANSACTIONS</Text>
            <Text style={styles.insightValueMono}>
              {monthlyTransactions.length}
            </Text>
          </View>
          <View style={styles.insightDivider} />
          <View style={styles.insightItem}>
            <Text style={styles.insightLabel}>TOP ACCOUNT</Text>
            <Text style={styles.insightValueMono}>
              {accountBreakdown[0]?.name.slice(0, 12) || '—'}
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
    },
    netRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING['4'],
      paddingTop: SPACING['4'],
      marginTop: SPACING['3'],
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
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING['3'],
      marginBottom: SPACING['4'],
      marginHorizontal: LAYOUT.screenPadding,
    },
    metricCard: {
      width: '47%',
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
      fontSize: 16,
    },
    metricValuePlain: {
      fontFamily: TYPOGRAPHY.fonts.monoBold,
      fontSize: 16,
      color: colors.text,
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
      fontSize: 14,
      color: colors.text,
    },
  });
