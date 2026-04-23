import React from 'react';
import { View } from 'react-native';
import { usePremium } from '../../src/providers/PremiumProvider';
import { useRecurringTransactions } from '../../src/features/recurring/api/recurring';
import { PremiumGuard } from '../../src/components/ui/PremiumGuard';
import { useTheme } from '../../src/providers/ThemeProvider';
import { Header } from '../../src/components/ui/Header';
import { BlurBackground } from '../../src/components/ui/BlurBackground';
import { RecurringFormPage } from '../../src/features/recurring/screens/RecurringFormPage';

export default function CreateRecurringRoute() {
  const { isPremium } = usePremium();
  const { data: recurringList, isLoading } = useRecurringTransactions();
  const { colors } = useTheme();

  // Show nothing while loading to prevent flashes
  if (isLoading) return null;

  const count = recurringList?.length || 0;
  
  // Free tier is limited to 3 recurring transactions
  if (!isPremium && count >= 3) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <BlurBackground />
        <Header title="New Recurring" subtitle="Plan limit reached" showBack />
        <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
          <PremiumGuard label="Unlimited Recurring" size="large">
            <View />
          </PremiumGuard>
        </View>
      </View>
    );
  }

  return <RecurringFormPage mode="create" />;
}
