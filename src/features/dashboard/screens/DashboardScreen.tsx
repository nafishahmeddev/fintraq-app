import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfirmDialog } from '../../../components/core/ConfirmDialog';
import { Header } from '../../../components/core/Header';
import { OptionsDialog } from '../../../components/core/OptionsDialog';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { AccountsCarousel } from '../components/AccountsCarousel';
import { ActivityFeed } from '../components/ActivityFeed';
import { BudgetSummaryCard } from '../components/BudgetSummaryCard';
import { GoalsSummaryCard } from '../components/GoalsSummaryCard';
import { HeroBalanceCard } from '../components/HeroBalanceCard';
import { LoansSummaryCard } from '../components/LoansSummaryCard';
import { PeopleSummaryCard } from '../components/PeopleSummaryCard';
import { PlacesSummaryCard } from '../components/PlacesSummaryCard';
import { TopExpenseCategoriesCard } from '../components/TopExpenseCategoriesCard';
import { useDashboard } from '../hooks/useDashboard';

export const DashboardScreen = React.memo(function DashboardScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();

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
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <Header
          title="Dashboard"
          subtitle={`Hi! ${profile.name ? profile.name.split(' ')[0] : ''}`}
          rightAction={
            !isPremium ? (
              <TouchableOpacity
                style={styles.proBanner}
                onPress={() => router.push('/premium')}
                activeOpacity={0.8}
              >
                <Ionicons name="sparkles" size={12} color={colors.primary} />
                <Text style={styles.proBannerText}>Go Pro</Text>
              </TouchableOpacity>
            ) : undefined
          }
        />

        <HeroBalanceCard
          balancesByCurrency={balancesByCurrency}
          selectedCurrency={selectedCurrency}
          currencyKeys={currencyKeys}
          monthlyData={monthlyData}
          onCurrencySelect={handleCurrencySelect}
        />

        <AccountsCarousel
          accounts={accounts ?? []}
          onAccountPress={navigateToAccountTransactions}
          onAccountLongPress={handleAccountLongPress}
          onNewAccount={openAccountForm}
        />

        <BudgetSummaryCard />

        <View style={styles.halfRow}>
          <GoalsSummaryCard />
          <LoansSummaryCard />
        </View>

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

        <View style={styles.halfRow}>
          <PeopleSummaryCard />
          <PlacesSummaryCard />
        </View>
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
    proBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.primarySubtle,
      borderWidth: 1,
      borderColor: theme.colors.primary + '30',
    },
    proBannerText: {
      fontFamily: theme.fontFamilies.sansBold,
      fontSize: 12,
      color: theme.colors.primary,
    },
  });
