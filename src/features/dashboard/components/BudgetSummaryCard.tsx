import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { useBudgetsProgress } from '../../budgets/api/budgets';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { useSettings } from '../../../providers/SettingsProvider';
import { MoneyText } from '../../../components/ui/MoneyText';

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

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(summary ? '/budgets' : '/budgets/create')}
        activeOpacity={0.7}
      >
        <View style={styles.topRow}>
          <Text style={styles.label}>Budgets</Text>
          {summary && <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />}
        </View>

        {summary ? (
          <>
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{summary.count}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
              <View style={styles.stat}>
                <MoneyText amount={summary.totalSpent} currency={profile.defaultCurrency} type="DR" style={styles.statAmount} weight="sansBold" />
                <Text style={styles.statLabel}>Spent</Text>
              </View>
              <View style={styles.stat}>
                <MoneyText amount={summary.totalRemaining} currency={profile.defaultCurrency} style={styles.statAmount} weight="sansBold" />
                <Text style={styles.statLabel}>Left</Text>
              </View>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(summary.percentage, 100)}%`, backgroundColor: summary.percentage >= 100 ? colors.danger : colors.primary }]} />
            </View>

            {summary.exceeded > 0 && (
              <Text style={styles.warning}>{summary.exceeded} budget{summary.exceeded > 1 ? 's' : ''} exceeded</Text>
            )}
          </>
        ) : (
          <Text style={styles.empty}>Set your first budget to track spending limits.</Text>
        )}
      </TouchableOpacity>
    </View>
  );
});

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    marginBottom: theme.spacing[20],
  },
  card: {
    marginHorizontal: theme.layout.screenPadding,
    padding: theme.spacing[16],
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing[12],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 10,
    color: theme.colors.textMuted,
    letterSpacing: 1,
  },
  statRow: {
    flexDirection: 'row',
    gap: theme.spacing[12],
  },
  stat: {
    flex: 1,
    gap: 2,
  },
  statNum: {
    fontFamily: theme.fontFamilies.heading,
    fontSize: 22,
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
    height: 4,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radius.full,
  },
  warning: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 11,
    color: theme.colors.danger,
  },
  empty: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
});
