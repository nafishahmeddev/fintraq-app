import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useBudgetsProgress } from '../../budgets/api/budgets';
import { useTheme } from '../../../providers/ThemeProvider';
import { useSettings } from '../../../providers/SettingsProvider';
import { ThemeColors } from '../../../theme/colors';
import { radius, spacing, LAYOUT } from '../../../theme/tokens';
import { Typography, Card } from '../../../components/ui';
import { SectionHeader } from './SectionHeader';
import { formatCurrency } from '../../../utils/format';

export const BudgetSummaryCard = React.memo(function BudgetSummaryCard() {
  const { colors } = useTheme();
  const { profile } = useSettings();
  const router = useRouter();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const { data: progressData, isLoading } = useBudgetsProgress();

  if (isLoading || !progressData || progressData.length === 0) {
    return null;
  }

  // Show top 2 budgets by percentage (closest to full)
  const topBudgets = [...progressData]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 2);

  return (
    <View style={styles.container}>
      <SectionHeader 
        title="BUDGETS" 
        rightText="See all" 
        onPressRight={() => router.push('/budgets')} 
      />

      <Card variant="outlined" size="lg" shadow="none" style={styles.card}>
        {topBudgets.map((budget, index) => {
          const isExceeded = budget.percentage >= 100;
          const isWarning = budget.percentage >= 80 && !isExceeded;
          const statusColor = isExceeded ? colors.danger : isWarning ? colors.warning : colors.primary;

          return (
            <View
              key={budget.budgetId}
              style={[styles.budgetItem, index < topBudgets.length - 1 && styles.borderBottom]}
            >
              <TouchableOpacity
                onPress={() => router.push(`/budgets/details/${budget.budgetId}`)}
                activeOpacity={0.7}
              >
                <View style={styles.budgetHeader}>
                  <View style={styles.budgetInfo}>
                    <Typography variant="body" weight="semibold" numberOfLines={1}>
                      {budget.name}
                    </Typography>
                  </View>
                  <Typography variant="mono" weight="semibold">
                    {formatCurrency(budget.remaining, profile.defaultCurrency)}{' '}
                    <Typography variant="label" color={colors.textMuted}>left</Typography>
                  </Typography>
                </View>

                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${Math.min(budget.percentage, 100)}%`, 
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
  budgetItem: {
    paddingVertical: spacing('1'),
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderStyle: 'dashed',
    marginBottom: spacing('4'),
    paddingBottom: spacing('4'),
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing('2.5'),
  },
  budgetInfo: {
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
});
