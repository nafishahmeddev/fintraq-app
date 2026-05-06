import React from 'react';
import { View } from 'react-native';
import { Header } from '../../src/components/ui/Header';
import { PremiumGuard } from '../../src/components/ui/PremiumGuard';
import { useBudgets } from '../../src/features/budgets/api/budgets';
import { BudgetFormPage } from '../../src/features/budgets/screens/BudgetFormPage';
import { usePremium } from '../../src/providers/PremiumProvider';
import { useTheme } from '../../src/providers/ThemeProvider';

export default function CreateBudgetRoute() {
  const { isPremium } = usePremium();
  const { data: budgetsList, isLoading } = useBudgets();
  const { colors } = useTheme();

  if (isLoading) return null;

  const count = budgetsList?.length || 0;

  // Free tier is limited to 1 Budget
  if (!isPremium && count >= 1) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>

        <Header title="New Budget" showBack />
        <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
          <PremiumGuard label="Unlimited Budgets" size="large">
            <View />
          </PremiumGuard>
        </View>
      </View>
    );
  }

  return <BudgetFormPage mode="create" />;
}
