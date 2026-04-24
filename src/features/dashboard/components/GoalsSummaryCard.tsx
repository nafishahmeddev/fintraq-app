import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useGoalsProgress } from '../../goals/api/goals';
import { useTheme } from '../../../providers/ThemeProvider';
import { useSettings } from '../../../providers/SettingsProvider';
import { ThemeColors } from '../../../theme/colors';
import { radius, spacing, LAYOUT } from '../../../theme/tokens';
import { Typography, Card } from '../../../components/ui';
import { SectionHeader } from './SectionHeader';
import { formatCurrency } from '../../../utils/format';

export const GoalsSummaryCard = React.memo(function GoalsSummaryCard() {
  const { colors } = useTheme();
  const { profile } = useSettings();
  const router = useRouter();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

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
        <Card variant="outlined" size="lg" shadow="none" style={styles.card}>
          {[...progressData]
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 2).map((goal, index, arr) => {
            const isReached = goal.percentage >= 100;
            const statusColor = isReached ? colors.success : colors.primary;

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
                      <Typography variant="body" weight="semibold" numberOfLines={1}>
                        {goal.name}
                      </Typography>
                    </View>
                    <Typography variant="mono" weight="semibold">
                      {formatCurrency(goal.remaining, profile.defaultCurrency)}{' '}
                      <Typography variant="label" color={colors.textMuted}>left</Typography>
                    </Typography>
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
        </Card>
      ) : (
        <TouchableOpacity 
          style={styles.emptyCard} 
          onPress={() => router.push('/goals/create')}
          activeOpacity={0.7}
        >
          <Typography variant="bodySm" color={colors.textMuted} align="center">
            Set your first financial goal to start tracking progress.
          </Typography>
          <Typography variant="bodySm" color={colors.primary} weight="bold" style={{ marginTop: spacing('2') }}>
            + Create Goal
          </Typography>
        </TouchableOpacity>
      )}
    </View>
  );
});

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    marginBottom: spacing('6'),
  },
  card: {
    marginHorizontal: LAYOUT.screenPadding,
    padding: spacing('4'),
  },
  goalItem: {
    paddingVertical: spacing('1'),
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderStyle: 'dashed',
    marginBottom: spacing('4'),
    paddingBottom: spacing('4'),
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing('2.5'),
  },
  goalInfo: {
    flex: 1,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border + '40',
    borderRadius: radius('full'),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius('full'),
  },
  emptyCard: {
    marginHorizontal: LAYOUT.screenPadding,
    padding: spacing('6'),
    borderRadius: radius('xl'),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
