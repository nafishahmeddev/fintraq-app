import { resolveIcon } from '@/src/utils/icons';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../../../components/ui/EmptyState';
import { MoneyText } from '../../../components/ui/MoneyText';
import { MetricCard } from '../../reports/components/MetricCard';
import { StreakBadge } from '../../reports/components/StreakBadge';
import { useWeeklyReport } from '../../reports/hooks/useReports';
import { useTheme } from '../../../providers/ThemeProvider';
import { ThemeColors } from '../../../theme/colors';
import { LAYOUT, RADIUS, SPACING } from '../../../theme/tokens';
import { TYPOGRAPHY } from '../../../theme/typography';

type Props = { currency: string };

export const WeeklyPanel = React.memo(function WeeklyPanel({ currency }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: report, isLoading } = useWeeklyReport(currency);

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
        <Text style={styles.heroKicker}>WEEKLY RECAP</Text>
        <Text style={styles.heroTitle}>
          {isHealthy ? 'Optimal Flow.' : 'Tight Margins.'}
        </Text>
        <Text style={styles.heroSubtitle}>
          {isHealthy ? 'Excellent discipline this window.' : 'Caution is advised this window.'}
        </Text>
        <View style={styles.streakWrap}>
          <StreakBadge />
        </View>
      </View>

      <View style={styles.metricGrid}>
        <MetricCard
          label="EXPENSE"
          value={report.totalExpense}
          currency={currency}
          trendMode="low_is_good"
          changeValue={report.comparison?.expenseChange}
        />
        <MetricCard
          label="SAVINGS RATE"
          value={report.savingsRate}
          currency={currency}
          isAmount={false}
          suffix="%"
          trendMode="high_is_good"
          changeValue={report.comparison?.incomeChange}
        />
      </View>

      <View style={styles.netCard}>
        <Text style={styles.netLabel}>NET POSITION</Text>
        <MoneyText
          amount={Math.abs(report.netPosition)}
          currency={currency}
          type={report.netPosition >= 0 ? 'CR' : 'DR'}
          style={styles.netAmount}
          weight="bold"
        />
        <View style={styles.netSubRow}>
          <View style={styles.netSubItem}>
            <Text style={styles.netSubLabel}>INCOME</Text>
            <MoneyText amount={report.totalIncome} currency={currency} type="CR" style={styles.netSubValue} />
          </View>
          <View style={[styles.netSubDivider, { backgroundColor: colors.text + '10' }]} />
          <View style={styles.netSubItem}>
            <Text style={styles.netSubLabel}>EXPENSE</Text>
            <MoneyText amount={report.totalExpense} currency={currency} type="DR" style={styles.netSubValue} />
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>BY SECTOR</Text>
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
            icon="calendar-outline"
            title="No activity this week"
            description="Log transactions to see your weekly breakdown."
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
    streakWrap: {
      marginTop: SPACING['4'],
    },
    metricGrid: {
      flexDirection: 'row',
      gap: SPACING['3'],
      marginBottom: SPACING['3'],
    },
    netCard: {
      borderRadius: RADIUS.xl,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      padding: SPACING['4'],
      marginBottom: SPACING['6'],
    },
    netLabel: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 9,
      color: colors.textMuted,
      letterSpacing: 1.4,
      marginBottom: SPACING['2'],
    },
    netAmount: {
      fontSize: 32,
      lineHeight: 36,
      letterSpacing: -1,
      marginBottom: SPACING['3'],
    },
    netSubRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING['3'],
    },
    netSubItem: {
      flex: 1,
    },
    netSubDivider: {
      width: 1,
      height: 28,
    },
    netSubLabel: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 9,
      color: colors.textMuted,
      letterSpacing: 1,
      marginBottom: SPACING['1'],
    },
    netSubValue: {
      fontSize: 13,
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
