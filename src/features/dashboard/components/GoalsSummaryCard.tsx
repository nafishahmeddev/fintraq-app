import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { useGoalsProgress } from '../../goals/api/goals';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { useSettings } from '../../../providers/SettingsProvider';
import { SectionHeader } from './SectionHeader';
import { formatCurrency } from '../../../utils/format';

export const GoalsSummaryCard = React.memo(function GoalsSummaryCard() {
  const theme = useTheme();
  const { profile } = useSettings();
  const router = useRouter();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const { data: progressData, isLoading } = useGoalsProgress();

  if (isLoading) {
    return null;
  }

  const hasGoals = progressData && progressData.length > 0;

  return (
    <View style={styles.container}>
      <SectionHeader 
        title="GOALS" 
        rightText={hasGoals ? "See all" : "New"} 
        onPressRight={() => router.push(hasGoals ? '/goals' : '/goals/create')} 
      />

      {hasGoals ? (
        <View style={styles.card}>
          {[...progressData]
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 2).map((goal, index, arr) => {
            const isReached = goal.percentage >= 100;
            const statusColor = isReached ? theme.colors.success : theme.colors.primary;

            return (
              <View
                key={goal.goalId}
                style={[styles.goalItem, index < arr.length - 1 && styles.borderBottom]}
              >
                <TouchableOpacity
                  onPress={() => router.push(`/goals/details/${goal.goalId}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.goalHeader}>
                    <View style={styles.goalInfo}>
                      <Text style={styles.goalName} numberOfLines={1}>
                        {goal.name}
                      </Text>
                    </View>
                    <Text style={styles.goalAmount}>
                      {formatCurrency(goal.remaining, profile.defaultCurrency)}{' '}
                      <Text style={styles.amountLabel}>left</Text>
                    </Text>
                  </View>

                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${Math.min(goal.percentage, 100)}%`, 
                          backgroundColor: statusColor 
                        }
                      ]} 
                    />
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.emptyCard} 
          onPress={() => router.push('/goals/create')}
          activeOpacity={0.7}
        >
          <Text style={styles.emptyText}>
            Set your first financial goal to start tracking progress.
          </Text>
          <Text style={styles.emptyAction}>
            + Create Goal
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    marginBottom: theme.spacing[24],
  },
  card: {
    marginHorizontal: theme.layout.screenPadding,
    padding: theme.spacing[16],
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.xs,
  },
  goalItem: {
    paddingVertical: theme.spacing[4],
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    borderStyle: 'dashed',
    marginBottom: theme.spacing[12],
    paddingBottom: theme.spacing[12],
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[12],
  },
  goalInfo: {
    flex: 1,
  },
  goalName: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: theme.fontSizes.md,
    color: theme.colors.text,
  },
  goalAmount: {
    fontFamily: theme.fontFamilies.monoBold,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text,
  },
  amountLabel: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radius.full,
  },
  emptyCard: {
    marginHorizontal: theme.layout.screenPadding,
    padding: theme.spacing[24],
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyAction: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.primaryDark,
    marginTop: theme.spacing[12],
  },
});
