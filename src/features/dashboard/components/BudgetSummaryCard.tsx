import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { useBudgetsProgress } from '../../budgets/api/budgets';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { useSettings } from '../../../providers/SettingsProvider';
import { SectionHeader } from './SectionHeader';
import { formatCurrency } from '../../../utils/format';

export const BudgetSummaryCard = React.memo(function BudgetSummaryCard() {
  const theme = useTheme();
  const { profile } = useSettings();
  const router = useRouter();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

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

      <View style={styles.card}>
        {topBudgets.map((budget, index) => {
          const isExceeded = budget.percentage >= 100;
          const isWarning = budget.percentage >= 80 && !isExceeded;
          const statusColor = isExceeded ? theme.colors.danger : isWarning ? theme.colors.warning : theme.colors.primary;

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
                    <Text style={styles.budgetName} numberOfLines={1}>
                      {budget.name}
                    </Text>
                  </View>
                  <Text style={styles.budgetAmount}>
                    {formatCurrency(budget.remaining, profile.defaultCurrency)}{' '}
                    <Text style={styles.amountLabel}>left</Text>
                  </Text>
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
      </View>
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
  budgetItem: {
    paddingVertical: theme.spacing[4],
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    borderStyle: 'dashed',
    marginBottom: theme.spacing[12],
    paddingBottom: theme.spacing[12],
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[12],
  },
  budgetInfo: {
    flex: 1,
  },
  budgetName: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: theme.fontSizes.md,
    color: theme.colors.text,
  },
  budgetAmount: {
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
});
