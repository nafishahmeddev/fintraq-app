import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MoneyText } from '../../../components/core/MoneyText';
import { useSettings } from '../../../providers/SettingsProvider';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { useGoalsProgress } from '../../goals/api/goals';

export const GoalsSummaryCard = React.memo(function GoalsSummaryCard() {
  const theme = useTheme();
  const { colors } = theme;
  const { profile } = useSettings();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { data: progressData } = useGoalsProgress();

  const summary = useMemo(() => {
    if (!progressData || progressData.length === 0) return null;
    const current = progressData.reduce((s, g) => s + g.current, 0);
    const target = progressData.reduce((s, g) => s + g.target, 0);
    const remaining = progressData.reduce((s, g) => s + g.remaining, 0);
    const percentage = target > 0 ? (current / target) * 100 : 0;
    return { count: progressData.length, current, target, remaining, percentage };
  }, [progressData]);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(summary ? '/goals' : '/goals/create')}
      activeOpacity={0.7}
    >
      <Text style={styles.label}>Goals</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min(summary?.percentage ?? 0, 100)}%`, backgroundColor: colors.primary }]} />
      </View>
      {summary ? (
        <>
          <View style={styles.statsRow}>
            <Text style={styles.statNum}>{summary.count}</Text>
            <Text style={styles.statPct}>{summary.percentage.toFixed(0)}%</Text>
          </View>
          <View style={styles.amounts}>
            <MoneyText amount={summary.current} currency={profile.defaultCurrency} style={styles.amount} weight="sansBold" />
            <Text style={styles.remain}>
              <MoneyText amount={summary.remaining} currency={profile.defaultCurrency} type="DR" style={styles.remain} weight="sansBold" /> left
            </Text>
          </View>
        </>
      ) : (
        <Text style={styles.empty}>Set your first goal</Text>
      )}
    </TouchableOpacity>
  );
});

const createStyles = (theme: Theme) => StyleSheet.create({
  card: {
    flex: 1,
    padding: theme.spacing[16],
    borderRadius: theme.radius['3xl'],
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing[8],
  },
  label: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 12,
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
  statsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing[4],
  },
  statNum: {
    fontFamily: theme.fontFamilies.heading,
    fontSize: 28,
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  statPct: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  amounts: {
    gap: 1,
  },
  amount: {
    fontSize: 14,
  },
  remain: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  empty: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
});
