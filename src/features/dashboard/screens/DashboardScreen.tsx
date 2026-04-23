import { usePremium } from '@/src/providers/PremiumProvider';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from '@sbaiahmed1/react-native-blur';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { ActivityIndicator, Platform, ScrollView,  Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Header } from '../../../components/ui/Header';
import { IconButton } from '../../../components/ui/IconButton';
import { MoneyText } from '../../../components/ui/MoneyText';
import { OptionsDialog } from '../../../components/ui/OptionsDialog';
import { TransactionRow } from '../../../components/ui/TransactionRow';
import { DEFAULT_CURRENCY } from '../../../constants/currency';
import { useSettings } from '../../../providers/SettingsProvider';
import { useTheme } from '../../../providers/ThemeProvider';
import type { Account } from '../../accounts/api/accounts';
import { useAccounts, useDeleteAccount } from '../../accounts/hooks/accounts';
import { StreakBadge } from '../../reports/components/StreakBadge';
import { useTransactions } from '../../transactions/hooks/transactions';
import { InsightsSection } from '../components/InsightsSection';
import { SectionHeader } from '../components/SectionHeader';
import { TopExpenseCategoriesCard } from '../components/TopExpenseCategoriesCard';
import { useDashboardStats, useTopExpenseCategories } from '../hooks/dashboard';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

type IoniconName = keyof typeof Ionicons.glyphMap;

const resolveIconName = (raw: string | null | undefined, fallback: IoniconName): IoniconName => {
  if (raw && raw in Ionicons.glyphMap) return raw as IoniconName;
  if (raw) {
    const outlined = `${raw}-outline`;
    if (outlined in Ionicons.glyphMap) return outlined as IoniconName;
  }
  return fallback;
};

export const DashboardScreen = React.memo(function DashboardScreen() {
  const { colors, isDark } = useTheme();
  const { isPremium } = usePremium();
  const { profile } = useSettings();
  const { width: screenWidth } = useWindowDimensions();
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

  // Get stats from the optimized SQL hook
  const { data: statsQueryData } = useDashboardStats(selectedCurrency);
  const totals = React.useMemo(() => statsQueryData ?? { income: 0, expense: 0 }, [statsQueryData]);

  // Get top categories from the optimized SQL hook
  const { data: topCategoriesData } = useTopExpenseCategories(selectedCurrency);
  const topExpenseCategories = React.useMemo(() => topCategoriesData ?? [], [topCategoriesData]);

  const topCategoryCurrencies = currencyKeys;
  const [selectedTopCategoryCurrency, setSelectedTopCategoryCurrency] = React.useState<string>(selectedCurrency);

  React.useEffect(() => {
    setSelectedTopCategoryCurrency(selectedCurrency);
  }, [selectedCurrency]);

  const handleAccountLongPress = useCallback((acc: Account) => {
    setActiveAccount(acc);
    setShowAccountOptionsDialog(true);
  }, []);

  const handleCurrencySelect = useCallback((curr: string) => {
    setSelectedCurrency(curr);
  }, []);

  const navigateToSearch = useCallback(() => {
    router.push('/search');
  }, [router]);

  const navigateToStats = useCallback(() => {
    router.push('/(main)/stats');
  }, [router]);

  const navigateToReports = useCallback(() => {
    router.push('/(main)/reports');
  }, [router]);

  const navigateToSettings = useCallback(() => {
    router.push('/settings');
  }, [router]);

  const navigateToPremium = useCallback(() => {
    router.push('/premium');
  }, [router]);

  const navigateToTransactions = useCallback(() => {
    router.push('/transactions');
  }, [router]);

  const navigateToCreateTransaction = useCallback(() => {
    router.push('/transactions/create');
  }, [router]);

  const navigateToAccountTransactions = useCallback((accountId: number) => {
    router.push(`/transactions?accountId=${accountId}`);
  }, [router]);

  const navigateToEditTransaction = useCallback((txId: number) => {
    router.push(`/transactions/edit/${txId}`);
  }, [router]);

  const openAccountForm = useCallback(() => {
    router.push('/account/create');
  }, [router]);

  const closeOptionsDialog = useCallback(() => {
    setShowAccountOptionsDialog(false);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setShowDeleteAccountDialog(false);
  }, []);

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
          router.push(`/account/edit/${activeAccount.id}`);
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

  if (txLoading || accountsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const incomeBarRatio = totals.income + totals.expense > 0
    ? totals.income / (totals.income + totals.expense)
    : 0.5;

  return (
    <SafeAreaView style={styles.container}>
      {/* Static background circles */}
      <View className="absolute inset-0" pointerEvents="none">
        <View style={[styles.bgCircle, { top: -60, left: -60, width: 340, height: 340, backgroundColor: colors.primary, opacity: 0.72 }]} />
        <View style={[styles.bgCircle, { top: 180, right: -110, width: 440, height: 440, backgroundColor: colors.primaryDark, opacity: 0.52 }]} />
        <View style={[styles.bgCircle, { bottom: -110, left: 40, width: 380, height: 380, backgroundColor: colors.primary, opacity: 0.6 }]} />
      </View>
      <BlurView blurAmount={Platform.OS === 'ios' ? 80 : 95} blurType={isDark ? 'dark' : 'light'} className="absolute inset-0" />
      {Platform.OS === 'android' && (
        <View className="absolute inset-0" style={[ { backgroundColor: colors.background + '60' }]} pointerEvents="none" />
      )}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <Header
          title="Dashboard"
          subtitle={`${getGreeting()}${profile.name ? `, ${profile.name.split(' ')[0]}` : ''}`}
          rightAction={(
            <View style={styles.headerActions}>
              <IconButton
                icon="search-outline"
                onPress={isPremium ? navigateToSearch : navigateToPremium}
                size="md"
                badge={!isPremium}
              />
              <IconButton
                icon="stats-chart-outline"
                onPress={isPremium ? navigateToStats : navigateToPremium}
                size="md"
                badge={!isPremium}
              />
              <IconButton
                icon="newspaper-outline"
                onPress={isPremium ? navigateToReports : navigateToPremium}
                size="md"
                badge={!isPremium}
              />
              <IconButton
                icon="settings-outline"
                onPress={navigateToSettings}
                size="md"
              />
            </View>
          )}
        />

        {/* ── Hero balance card ── */}
        <View style={styles.heroCard}>
          {/* Currency switcher tabs */}
          {currencyKeys.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.currencyTabsRow}>
              {currencyKeys.map(curr => (
                <TouchableOpacity
                  key={curr}
                  style={[styles.currencyTab, selectedCurrency === curr && styles.currencyTabActive]}
                  onPress={() => handleCurrencySelect(curr)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.currencyTabText, selectedCurrency === curr && styles.currencyTabTextActive]}>{curr}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Text style={styles.heroBadge}>TOTAL BALANCE</Text>
            <StreakBadge />
          </View>
          <MoneyText
            amount={balancesByCurrency[selectedCurrency] || 0}
            currency={selectedCurrency}
            style={styles.heroBalance}
            weight="bold"
          />

          {/* Income / Expense split bar */}
          <View style={styles.splitRow}>
            <View style={styles.splitItem}>
              <View style={[styles.splitDot, { backgroundColor: colors.success }]} />
              <Text style={styles.splitLabel}>IN</Text>
              <MoneyText amount={totals.income} currency={selectedCurrency} type="CR" weight="bold" style={styles.splitValue} />
            </View>
            <View style={styles.splitDivider} />
            <View style={styles.splitItem}>
              <View style={[styles.splitDot, { backgroundColor: colors.danger }]} />
              <Text style={styles.splitLabel}>OUT</Text>
              <MoneyText amount={totals.expense} currency={selectedCurrency} type="DR" weight="bold" style={styles.splitValue} />
            </View>
          </View>

          {/* Visual bar */}
          <View style={styles.flowBar}>
            <View style={[styles.flowBarIncome, { flex: incomeBarRatio }]} />
            <View style={[styles.flowBarExpense, { flex: 1 - incomeBarRatio }]} />
          </View>
        </View>

        {/* ── Insights Layer (Pro Only) ── */}
        <InsightsSection currency={selectedCurrency} />

        {/* ── Quick actions ── */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionPrimary} onPress={navigateToCreateTransaction} activeOpacity={0.85}>
            <Ionicons name="add" size={20} color={colors.background} />
            <Text style={styles.quickActionPrimaryText}>Add Transaction</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionSecondary} onPress={navigateToTransactions} activeOpacity={0.85}>
            <Ionicons name="list-outline" size={18} color={colors.text} />
            <Text style={styles.quickActionSecondaryText}>All Transactions</Text>
          </TouchableOpacity>
        </View>

        {/* ── Accounts section ── */}
        <SectionHeader
          title="ACCOUNTS"
          rightText="New"
          onPressRight={openAccountForm}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.accountsScroll}
          contentContainerStyle={styles.accountsScrollContent}
        >
          {accounts?.map(acc => {
            const accColor = '#' + acc.color.toString(16).padStart(6, '0');
            return (
              <TouchableOpacity
                key={acc.id}
                style={styles.accountCard}
                onPress={() => navigateToAccountTransactions(acc.id)}
                onLongPress={() => handleAccountLongPress(acc)}
                delayLongPress={250}
                activeOpacity={0.88}
              >
                <View style={styles.accountCardInner}>
                  <View style={styles.accountCardTop}>
                    <View style={styles.accountCardLead}>
                      <View style={[styles.accountIconBox, { backgroundColor: accColor + '20' }]}>
                        <Ionicons name={resolveIconName(acc.icon, 'wallet-outline')} size={18} color={accColor} />
                      </View>
                      <View style={styles.accountCardMeta}>
                        <Text style={styles.accountCardName} numberOfLines={1}>{acc.name}</Text>
                        <Text style={styles.accountCardHint}>
                          {acc.accountNumber && acc.accountNumber !== 'N/A'
                            ? `•••• ${acc.accountNumber.slice(-4)}`
                            : 'Tap to view activity'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.accountCurrencyBadge}>
                      <Text style={[styles.accountCurrencyText, { color: accColor }]}>{acc.currency}</Text>
                    </View>
                  </View>

                  <Text style={styles.accountBalanceLabel}>AVAILABLE</Text>
                  <MoneyText amount={acc.balance} currency={acc.currency} style={styles.accountCardBalance} weight="bold" />

                  <View style={styles.accountCardStats}>
                    <View style={styles.accountCardStatCol}>
                      <Text style={styles.accountCardStatLabel}>TOTAL IN</Text>
                      <MoneyText amount={acc.income} currency={acc.currency} style={styles.accountCardStatValue} type="CR" />
                    </View>
                    <View style={styles.accountCardStatDivider} />
                    <View style={styles.accountCardStatCol}>
                      <Text style={styles.accountCardStatLabel}>TOTAL OUT</Text>
                      <MoneyText amount={acc.expense} currency={acc.currency} style={styles.accountCardStatValue} type="DR" />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={styles.accountPlaceholderCard}
            onPress={openAccountForm}
            activeOpacity={0.88}
          >
            <View style={styles.accountPlaceholderInner}>
              <View style={styles.accountPlaceholderIcon}>
                <Ionicons name="add" size={22} color={colors.text} />
              </View>
              <Text style={styles.accountPlaceholderTitle}>New Account</Text>
              <Text style={styles.accountPlaceholderText}>Add another wallet, bank, or cash account.</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* ── Top expense categories ── */}
        <SectionHeader title="TOP EXPENSE CATEGORIES" rightText={selectedTopCategoryCurrency} />
        <TopExpenseCategoriesCard
          currencies={topCategoryCurrencies}
          selectedCurrency={selectedTopCategoryCurrency}
          onSelectCurrency={setSelectedTopCategoryCurrency}
          categories={topExpenseCategories}
        />

        {/* ── Recent activity ── */}
        <SectionHeader title="RECENT" rightText="See all" onPressRight={navigateToTransactions} />

        <View style={[styles.activityCard, { backgroundColor: "transparent" }]}>
          {transactions && transactions.length > 0 ? (
            transactions.slice(0, 6).map((tx, idx) => {
              const isLast = idx === Math.min(transactions.length, 6) - 1;
              return (
                <TransactionRow
                  key={tx.id}
                  tx={tx}
                  colors={colors}
                  isFirst={idx === 0}
                  isLast={isLast}
                  showDate
                  onPress={() => navigateToEditTransaction(tx.id)}
                />
              );
            })
          ) : (
            <View style={styles.emptyActivity}>
              <Ionicons name="receipt-outline" size={28} color={colors.textMuted} />
              <Text style={styles.emptyActivityText}>No transactions yet</Text>
              <TouchableOpacity style={styles.emptyActivityAction} onPress={navigateToCreateTransaction}>
                <Text style={styles.emptyActivityActionText}>Add one now</Text>
                <Ionicons name="arrow-forward" size={12} color={colors.background} />
              </TouchableOpacity>
            </View>
          )}
        </View>

      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={navigateToCreateTransaction} activeOpacity={0.9}>
        <Ionicons name="add" size={28} color={colors.background} />
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

