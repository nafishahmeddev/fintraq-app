import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Header } from '../../../components/ui/Header';
import { IconButton } from '../../../components/ui/IconButton';
import { OptionsDialog } from '../../../components/ui/OptionsDialog';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { useDashboard } from '../hooks/useDashboard';
import { HeroBalanceCard } from '../components/HeroBalanceCard';
import { AccountsCarousel } from '../components/AccountsCarousel';
import { ActivityFeed } from '../components/ActivityFeed';
import { BudgetSummaryCard } from '../components/BudgetSummaryCard';
import { GoalsSummaryCard } from '../components/GoalsSummaryCard';
import { LoansSummaryCard } from '../components/LoansSummaryCard';
import { PeopleSummaryCard } from '../components/PeopleSummaryCard';
import { PlacesSummaryCard } from '../components/PlacesSummaryCard';
import { TopExpenseCategoriesCard } from '../components/TopExpenseCategoriesCard';

export const DashboardScreen = React.memo(function DashboardScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const {
    isPremium,
    profile,
    transactions,
    accounts,
    isLoading,
    totals,
    selectedCurrency,
    currencyKeys,
    balancesByCurrency,
    incomeBarRatio,
    topExpenseCategories,
    selectedTopCategoryCurrency,
    setSelectedTopCategoryCurrency,
    monthlyData,
    handleCurrencySelect,
    handleAccountLongPress,
    navigateToSettings,
    navigateToTransactions,
    navigateToCreateTransaction,
    navigateToAccountTransactions,
    navigateToEditTransaction,
    openAccountForm,
    showAccountOptionsDialog,
    showDeleteAccountDialog,
    closeOptionsDialog,
    closeDeleteDialog,
    handleDeleteConfirm,
    accountOptions,
    activeAccount,
    topCategoryCurrencies,
  } = useDashboard();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header
          title="Dashboard"
          subtitle={`Hi! ${profile.name ? profile.name.split(' ')[0] : ''}`}
          rightAction={(
            <View style={styles.headerActions}>
              <IconButton
                icon="notifications-outline"
                onPress={navigateToSettings}
                size="md"
              />
            </View>
          )}
        />

        <HeroBalanceCard
          balancesByCurrency={balancesByCurrency}
          selectedCurrency={selectedCurrency}
          currencyKeys={currencyKeys}
          monthlyData={monthlyData}
          onCurrencySelect={handleCurrencySelect}
        />

        <BudgetSummaryCard />

        <View style={styles.halfRow}>
          <GoalsSummaryCard />
          <LoansSummaryCard />
        </View>

        <View style={styles.halfRow}>
          <PeopleSummaryCard />
          <PlacesSummaryCard />
        </View>

        <AccountsCarousel
          accounts={accounts ?? []}
          onAccountPress={navigateToAccountTransactions}
          onAccountLongPress={handleAccountLongPress}
          onNewAccount={openAccountForm}
        />

        <TopExpenseCategoriesCard
          currencies={topCategoryCurrencies}
          selectedCurrency={selectedTopCategoryCurrency}
          onSelectCurrency={setSelectedTopCategoryCurrency}
          categories={topExpenseCategories}
        />

        <ActivityFeed
          transactions={transactions}
          onViewAll={navigateToTransactions}
          onEditTransaction={navigateToEditTransaction}
          onCreateTransaction={navigateToCreateTransaction}
        />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={navigateToCreateTransaction} activeOpacity={0.9}>
        <Ionicons name="add" size={28} color={colors.onPrimary} />
      </TouchableOpacity>

      <OptionsDialog
        visible={showAccountOptionsDialog}
        onClose={closeOptionsDialog}
        title="Manage Account"
        subtitle={activeAccount?.name}
        options={accountOptions}
      />

      <ConfirmDialog
        visible={showDeleteAccountDialog}
        onClose={closeDeleteDialog}
        title="Delete Account"
        message={activeAccount ? `Delete ${activeAccount.name}? This action cannot be undone.` : undefined}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
      />
    </SafeAreaView>
  );
});

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    content: {
      paddingBottom: 100,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[8],
    },
    halfRow: {
      flexDirection: 'row',
      paddingHorizontal: theme.layout.screenPadding,
      gap: theme.spacing[12],
      marginBottom: theme.spacing[24],
    },
    fab: {
      position: 'absolute',
      bottom: 34,
      right: theme.layout.screenPadding,
      width: 56,
      height: 56,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadow.md,
    },
  });
