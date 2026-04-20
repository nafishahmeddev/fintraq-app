import { resolveIcon } from '@/src/utils/icons';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../../../components/ui/EmptyState';
import { MoneyText } from '../../../components/ui/MoneyText';
import { MetricCard } from '../../reports/components/MetricCard';
import { useMonthlyReport } from '../../reports/hooks/useReports';
import { useTheme } from '../../../providers/ThemeProvider';
import { ThemeColors } from '../../../theme/colors';
import { LAYOUT, RADIUS, SPACING } from '../../../theme/tokens';
import { TYPOGRAPHY } from '../../../theme/typography';

type Props = { currency: string };

export const MonthlyPanel = React.memo(function MonthlyPanel({ currency }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: report, isLoading } = useMonthlyReport(currency);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!report) return null;

  const isHealthy = report.savingsRate >= 20;

  return (
    <View>
      <View style={styles.heroSection}>
        <Text style={styles.heroKicker}>MONTHLY AUDIT</Text>
        <Text style={styles.heroTitle}>
          {isHealthy ? 'Solid Accumulation.' : 'Increased Burn.'}
        </Text>
        <Text style={styles.heroSubtitle}>
          {`${report.periodLabel}: ${report.savingsRate.toFixed(1)}% savings rate. `}
          {isHealthy ? 'Building wealth efficiently.' : 'Monitor discretionary sectors.'}
        </Text>
      </View>

      <View style={styles.metricGrid}>
        <MetricCard
          label="REVENUE"
          value={report.totalIncome}
          currency={currency}
          trendMode="high_is_good"
        />
        <MetricCard
          label="EXPENSE"
          value={report.totalExpense}
          currency={currency}
          trendMode="low_is_good"
        />
      </View>
      <View style={[styles.metricGrid, styles.metricGridSecond]}>
        <MetricCard
          label="NET POSITION"
          value={report.netPosition}
          currency={currency}
          trendMode="high_is_good"
        />
        <MetricCard
          label="SAVINGS RATE"
          value={report.savingsRate}
          currency={currency}
          isAmount={false}
          suffix="%"
          trendMode="high_is_good"
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>DOMINANT SECTORS</Text>
        <Text style={styles.sectionHint}>{report.topCategories.length} groups</Text>
      </View>
      <View style={styles.card}>
        {report.topCategories.length > 0 ? (
          report.topCategories.map((cat, index) => (
            <View
              key={cat.id}
              style={[styles.catRow, index === report.topCategories.length - 1 && styles.catRowLast]}
            >
              <View style={[styles.catIcon, { backgroundColor: cat.color + '20' }]}>
                <Ionicons
                  name={resolveIcon(cat.icon, 'pricetag-outline')}
                  size={LAYOUT.iconSm}
                  color={cat.color}
                />
              </View>
              <View style={styles.catBody}>
                <View style={styles.catTopLine}>
                  <Text style={styles.catName}>{cat.name}</Text>
                  <MoneyText
                    amount={cat.amount}
                    currency={currency}
                    style={styles.catAmount}
                    weight="semibold"
                  />
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${cat.percentage}%`, backgroundColor: cat.color },
                    ]}
                  />
                </View>
              </View>
            </View>
          ))
        ) : (
          <EmptyState
            icon="pie-chart-outline"
            title="No category data"
            description="Add transactions with categories to see your monthly breakdown."
            size="compact"
            variant="card"
            fullHeight={false}
          />
        )}
      </View>
    </View>
  );
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    loading: {
      paddingVertical: SPACING['11'],
      alignItems: 'center',
    },
    heroSection: {
      marginBottom: SPACING['6'],
    },
    heroKicker: {
      fontFamily: TYPOGRAPHY.fonts.bold,
      fontSize: 10,
      color: colors.primary,
      letterSpacing: 2.5,
      marginBottom: SPACING['2.5'],
    },
    heroTitle: {
      fontFamily: TYPOGRAPHY.fonts.headingRegular,
      fontSize: 40,
      lineHeight: 44,
      color: colors.text,
      letterSpacing: -2,
      marginBottom: SPACING['2'],
    },
    heroSubtitle: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 14,
      color: colors.textMuted,
      lineHeight: 22,
    },
    metricGrid: {
      flexDirection: 'row',
      gap: SPACING['3'],
      marginBottom: SPACING['3'],
    },
    metricGridSecond: {
      marginBottom: SPACING['6'],
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING['3'],
    },
    sectionLabel: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 10,
      color: colors.text,
      letterSpacing: 1.2,
    },
    sectionHint: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 11,
      color: colors.textMuted,
    },
    card: {
      borderRadius: RADIUS.xl,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      marginBottom: SPACING['6'],
    },
    catRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: SPACING['4'],
      borderBottomWidth: 1,
      borderBottomColor: colors.text + '08',
      gap: SPACING['3'],
    },
    catRowLast: {
      borderBottomWidth: 0,
    },
    catIcon: {
      width: SPACING['10'],
      height: SPACING['10'],
      borderRadius: RADIUS.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    catBody: {
      flex: 1,
    },
    catTopLine: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING['2'],
    },
    catName: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 14,
      color: colors.text,
    },
    catAmount: {
      fontSize: 13,
    },
    progressTrack: {
      height: 3,
      backgroundColor: colors.text + '10',
      borderRadius: RADIUS.xs,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: RADIUS.xs,
    },
  });
