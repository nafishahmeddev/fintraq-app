import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MoneyText } from '../../../components/core/MoneyText';
import { useSettings } from '../../../providers/SettingsProvider';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { useBudgetsProgress } from '../../budgets/api/budgets';

export const BudgetSummaryCard = React.memo(function BudgetSummaryCard() {
  const theme = useTheme();
  const { colors } = theme;
  const { profile } = useSettings();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { data: progressData } = useBudgetsProgress();

  const summary = useMemo(() => {
    if (!progressData || progressData.length === 0) return null;
    const totalSpent = progressData.reduce((s, b) => s + b.spent, 0);
    const totalBudgeted = progressData.reduce((s, b) => s + b.total, 0);
    const totalRemaining = progressData.reduce((s, b) => s + b.remaining, 0);
    const overallPct = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
    const exceeded = progressData.filter(b => b.percentage >= 100).length;
    return { count: progressData.length, totalSpent, totalBudgeted, totalRemaining, percentage: overallPct, exceeded };
  }, [progressData]);

  const isOver = (summary?.percentage ?? 0) >= 100;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(summary ? '/budgets' : '/budgets/create')}
      activeOpacity={0.7}
    >
      <View style={styles.topRow}>
        <Text style={styles.label}>Budgets</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
      </View>

      {summary ? (
        <>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{summary.count}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <MoneyText amount={summary.totalSpent} currency={profile.defaultCurrency} type="DR" style={styles.statAmount} weight="sansBold" />
              <Text style={styles.statLabel}>Spent</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <MoneyText amount={summary.totalRemaining} currency={profile.defaultCurrency} style={[styles.statAmount, isOver && { color: colors.danger }]} weight="sansBold" />
              <Text style={styles.statLabel}>Remaining</Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[
              styles.progressFill,
              {
                width: `${Math.min(summary.percentage, 100)}%`,
                backgroundColor: isOver ? colors.danger : colors.primary,
              }
            ]} />
          </View>

          <View style={styles.progressMeta}>
            <Text style={styles.progressPct}>{summary.percentage.toFixed(0)}% used</Text>
            {summary.exceeded > 0 && (
              <Text style={styles.warning}>{summary.exceeded} exceeded</Text>
            )}
          </View>
        </>
      ) : (
        <Text style={styles.empty}>Set spending limits with budgets.</Text>
      )}
    </TouchableOpacity>
  );
});

const createStyles = (theme: Theme) => StyleSheet.create({
  card: {
    marginHorizontal: theme.layout.screenPadding,
    marginBottom: theme.spacing[12],
    padding: theme.spacing[20],
    borderRadius: theme.radius['3xl'],
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing[16],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[16],
  },
  stat: {
    flex: 1,
    gap: 3,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: theme.colors.border,
  },
  statNum: {
    fontFamily: theme.fontFamilies.heading,
    fontSize: 24,
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  statAmount: {
    fontSize: 14,
  },
  statLabel: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  progressTrack: {
    height: 6,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radius.full,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -theme.spacing[8],
  },
  progressPct: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  warning: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 11,
    color: theme.colors.danger,
  },
  empty: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
});
