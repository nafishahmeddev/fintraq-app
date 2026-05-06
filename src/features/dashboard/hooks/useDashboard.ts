import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { usePremium } from '@/src/providers/PremiumProvider';
import { useSettings } from '@/src/providers/SettingsProvider';
import { DEFAULT_CURRENCY } from '@/src/constants/currency';
import type { Account } from '../../accounts/api/accounts';
import { useAccounts, useDeleteAccount } from '../../accounts/hooks/accounts';
import { useTransactions } from '../../transactions/hooks/transactions';
import { useDashboardStats, useTopExpenseCategories, useMonthlyComparison } from './queries';

export type DashboardNavigation = {
  navigateToSearch: () => void;
  navigateToAnalytics: () => void;
  navigateToSettings: () => void;
  navigateToPremium: () => void;
  navigateToTransactions: () => void;
  navigateToCreateTransaction: () => void;
  navigateToAccountTransactions: (accountId: number) => void;
  navigateToEditTransaction: (txId: number) => void;
  openAccountForm: () => void;
};

export function useDashboard() {
  const { isPremium } = usePremium();
  const { profile } = useSettings();
  const router = useRouter();

  const { data: transactions, isLoading: txLoading } = useTransactions(6);
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { mutateAsync: deleteAccount } = useDeleteAccount();

  const [showAccountOptionsDialog, setShowAccountOptionsDialog] = React.useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = React.useState(false);
  const [activeAccount, setActiveAccount] = React.useState<Account | undefined>(undefined);

  const balancesByCurrency = React.useMemo(() => {
    return accounts?.reduce((acc, account) => {
      acc[account.currency] = (acc[account.currency] || 0) + account.balance;
      return acc;
    }, {} as Record<string, number>) || {};
  }, [accounts]);

  const currencyKeys = React.useMemo(() => {
    const keys = Object.keys(balancesByCurrency);
    return keys.length > 0 ? keys : [DEFAULT_CURRENCY];
  }, [balancesByCurrency]);

  const [selectedCurrency, setSelectedCurrency] = React.useState<string>(currencyKeys[0]);

  React.useEffect(() => {
    if (!currencyKeys.includes(selectedCurrency)) {
      setSelectedCurrency(currencyKeys[0]);
    }
  }, [currencyKeys, selectedCurrency]);

  const { data: statsQueryData } = useDashboardStats(selectedCurrency);
  const totals = React.useMemo(() => statsQueryData ?? { income: 0, expense: 0 }, [statsQueryData]);

  const { data: topCategoriesData } = useTopExpenseCategories(selectedCurrency);
  const { data: monthlyData } = useMonthlyComparison(selectedCurrency);
  const topExpenseCategories = React.useMemo(() => topCategoriesData ?? [], [topCategoriesData]);

  const [selectedTopCategoryCurrency, setSelectedTopCategoryCurrency] = React.useState<string>(selectedCurrency);

  React.useEffect(() => {
    setSelectedTopCategoryCurrency(selectedCurrency);
  }, [selectedCurrency]);

  const incomeBarRatio = React.useMemo(() => {
    return totals.income + totals.expense > 0
      ? totals.income / (totals.income + totals.expense)
      : 0.5;
  }, [totals.income, totals.expense]);

  const handleAccountLongPress = useCallback((acc: Account) => {
    setActiveAccount(acc);
    setShowAccountOptionsDialog(true);
  }, []);

  const handleCurrencySelect = useCallback((curr: string) => {
    setSelectedCurrency(curr);
  }, []);

  const navigateToSearch = useCallback(() => router.push('/search'), [router]);
  const navigateToAnalytics = useCallback(() => router.push('/(main)/analytics'), [router]);
  const navigateToSettings = useCallback(() => router.push('/settings'), [router]);
  const navigateToPremium = useCallback(() => router.push('/premium'), [router]);
  const navigateToTransactions = useCallback(() => router.push('/transactions'), [router]);
  const navigateToCreateTransaction = useCallback(() => router.push('/transactions/create'), [router]);
  const navigateToAccountTransactions = useCallback((accountId: number) => router.push(`/transactions?accountId=${accountId}`), [router]);
  const navigateToEditTransaction = useCallback((txId: number) => router.push(`/transactions/edit/${txId}`), [router]);
  const openAccountForm = useCallback(() => router.push('/accounts/create'), [router]);

  const closeOptionsDialog = useCallback(() => setShowAccountOptionsDialog(false), []);
  const closeDeleteDialog = useCallback(() => setShowDeleteAccountDialog(false), []);

  const handleDeleteConfirm = useCallback(() => {
    if (!activeAccount) return;
    deleteAccount(activeAccount.id);
    setActiveAccount(undefined);
  }, [activeAccount, deleteAccount]);

  const accountOptions = React.useMemo(() => {
    if (!activeAccount) return [];
    return [
      {
        key: 'edit-account',
        label: 'Edit account',
        icon: 'create-outline' as const,
        onPress: () => {
          closeOptionsDialog();
          router.push(`/accounts/edit/${activeAccount.id}`);
        },
      },
      {
        key: 'delete-account',
        label: 'Delete account',
        icon: 'trash-outline' as const,
        destructive: true,
        onPress: () => setShowDeleteAccountDialog(true),
      },
    ];
  }, [activeAccount, closeOptionsDialog, router]);

  const isLoading = txLoading || accountsLoading;

  return {
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
    navigateToSearch,
    navigateToAnalytics,
    navigateToSettings,
    navigateToPremium,
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
    topCategoryCurrencies: currencyKeys,
  };
}
