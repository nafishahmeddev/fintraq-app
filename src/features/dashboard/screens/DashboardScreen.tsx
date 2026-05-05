import { usePremium } from '@/src/providers/PremiumProvider';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Header } from '../../../components/ui/Header';
import { IconButton } from '../../../components/ui/IconButton';
import { MoneyText } from '../../../components/ui/MoneyText';
import { OptionsDialog } from '../../../components/ui/OptionsDialog';
import { TransactionRow } from '../../../components/ui/TransactionRow';
import { DEFAULT_CURRENCY } from '../../../constants/currency';
import { useSettings } from '../../../providers/SettingsProvider';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import type { Account } from '../../accounts/api/accounts';
import { useAccounts, useDeleteAccount } from '../../accounts/hooks/accounts';
import { useTransactions } from '../../transactions/hooks/transactions';
import { BudgetSummaryCard } from '../components/BudgetSummaryCard';
import { GoalsSummaryCard } from '../components/GoalsSummaryCard';
import { LoansSummaryCard } from '../components/LoansSummaryCard';
import { PeopleSummaryCard } from '../components/PeopleSummaryCard';
import { PlacesSummaryCard } from '../components/PlacesSummaryCard';
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
  const theme = useTheme();
  const { colors } = theme;
  const { isPremium } = usePremium();
  const { profile } = useSettings();
  const { width: screenWidth } = useWindowDimensions();
  const styles = React.useMemo(() => createStyles(theme, screenWidth), [theme, screenWidth]);
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
  const totals = React.useMemo(() => statsQueryData ?? { income: 0, expense: 0, totalSaved: 0, totalDebt: 0 }, [statsQueryData]);

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

  const navigateToAnalytics = useCallback(() => {
    router.push('/(main)/analytics');
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
                icon="analytics-outline"
                onPress={isPremium ? navigateToAnalytics : navigateToPremium}
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
            <Text style={styles.heroBadge}>Total balance</Text>
          </View>
          <MoneyText
            amount={balancesByCurrency[selectedCurrency] || 0}
            currency={selectedCurrency}
            style={styles.heroBalance}
            weight="sansBold"
            display
          />

          {/* Income / Expense split bar */}
          <View style={styles.splitRow}>
            <View style={styles.splitItem}>
              <View style={[styles.splitDot, { backgroundColor: colors.success }]} />
              <Text style={styles.splitLabel}>In</Text>
              <MoneyText amount={totals.income} currency={selectedCurrency} type="CR" weight="sansBold" style={styles.splitValue} />
            </View>
            <View style={styles.splitDivider} />
            <View style={styles.splitItem}>
              <View style={[styles.splitDot, { backgroundColor: colors.danger }]} />
              <Text style={styles.splitLabel}>Out</Text>
              <MoneyText amount={totals.expense} currency={selectedCurrency} type="DR" weight="sansBold" style={styles.splitValue} />
            </View>
          </View>

          {/* Visual bar */}
          <View style={styles.flowBar}>
            <View style={[styles.flowBarIncome, { flex: incomeBarRatio }]} />
            <View style={[styles.flowBarExpense, { flex: 1 - incomeBarRatio }]} />
          </View>
        </View>

        {/* ── KPI Grid ── */}
        <View style={styles.kpiGrid}>
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => router.push('/goals')}
            activeOpacity={0.8}
          >
            <View style={styles.kpiHeader}>
              <View style={[styles.kpiIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
              </View>
              <Text style={styles.kpiLabel}>Saved</Text>
            </View>
            <MoneyText
              amount={totals.totalSaved || 0}
              currency={selectedCurrency}
              style={styles.kpiValue}
              weight="sansBold"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => router.push('/loans')}
            activeOpacity={0.8}
          >
            <View style={styles.kpiHeader}>
              <View style={[styles.kpiIcon, { backgroundColor: colors.danger + '15' }]}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
              </View>
              <Text style={styles.kpiLabel}>Debt</Text>
            </View>
            <MoneyText
              amount={totals.totalDebt || 0}
              currency={selectedCurrency}
              style={styles.kpiValue}
              weight="sansBold"
              type="DR"
            />
          </TouchableOpacity>
        </View>


        {/* ── Budget Summary ── */}
        <BudgetSummaryCard />

        {/* ── Goals Summary ── */}
        <GoalsSummaryCard />

        {/* ── Loans Summary ── */}
        <LoansSummaryCard />

        {/* ── People Summary ── */}
        <PeopleSummaryCard />

        {/* ── Places Summary ── */}
        <PlacesSummaryCard />

        {/* ── Quick actions ── */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionPrimary} onPress={navigateToCreateTransaction} activeOpacity={0.85}>
            <Ionicons name="add" size={20} color={colors.onPrimary} />
            <Text style={styles.quickActionPrimaryText}>Add transaction</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionSecondary} onPress={navigateToTransactions} activeOpacity={0.85}>
            <Ionicons name="list-outline" size={18} color={colors.text} />
            <Text style={styles.quickActionSecondaryText}>All transactions</Text>
          </TouchableOpacity>
        </View>

        {/* ── Accounts section ── */}
        <SectionHeader
          title="Accounts"
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

                  <Text style={styles.accountBalanceLabel}>Available</Text>
                  <MoneyText amount={acc.balance} currency={acc.currency} style={styles.accountCardBalance} weight="sansBold" />

                  <View style={styles.accountCardStats}>
                    <View style={styles.accountCardStatCol}>
                      <Text style={styles.accountCardStatLabel}>Total in</Text>
                      <MoneyText amount={acc.income} currency={acc.currency} style={styles.accountCardStatValue} type="CR" />
                    </View>
                    <View style={styles.accountCardStatDivider} />
                    <View style={styles.accountCardStatCol}>
                      <Text style={styles.accountCardStatLabel}>Total out</Text>
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
        <SectionHeader title="Top expense categories" rightText={selectedTopCategoryCurrency} />
        <TopExpenseCategoriesCard
          currencies={topCategoryCurrencies}
          selectedCurrency={selectedTopCategoryCurrency}
          onSelectCurrency={setSelectedTopCategoryCurrency}
          categories={topExpenseCategories}
        />

        {/* ── Recent activity ── */}
        <SectionHeader title="Recent" rightText="See all" onPressRight={navigateToTransactions} />

        <View style={[styles.activityCard, { backgroundColor: "transparent" }]}>
          {transactions && transactions.length > 0 ? (
            transactions.slice(0, 6).map((tx, idx) => {
              const isLast = idx === Math.min(transactions.length, 6) - 1;
              return (
                <TransactionRow
                  key={tx.id}
                  tx={tx}
                  isFirst={idx === 0}
                  isLast={isLast}
                  showDate
                  onPress={() => navigateToEditTransaction(tx.id)}
                />
              );
            })
          ) : (
            <View style={styles.emptyActivity}>
              <Ionicons name="receipt-outline" size={28} color={colors.primary} />
              <Text style={styles.emptyActivityText}>No transactions yet</Text>
              <TouchableOpacity style={styles.emptyActivityAction} onPress={navigateToCreateTransaction}>
                <Text style={styles.emptyActivityActionText}>Add one now</Text>
                <Ionicons name="arrow-forward" size={12} color={colors.onPrimary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

      </ScrollView>

      {/* FAB */}
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
const createStyles = (theme: Theme, screenWidth: number) =>
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
    // Hero Balance Card
    heroCard: {
      marginHorizontal: theme.layout.screenPadding,
      marginTop: theme.spacing[16],
      marginBottom: theme.spacing[32],
      padding: theme.spacing[24],
      borderRadius: theme.radius['3xl'],
      backgroundColor: theme.colors.card,
    },
    currencyTabsRow: {
      flexDirection: 'row',
      gap: theme.spacing[8],
      marginBottom: theme.spacing[20],
    },
    currencyTab: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    currencyTabActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    currencyTabText: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 10,
      color: theme.colors.textMuted,
    },
    currencyTabTextActive: {
      color: theme.colors.onPrimary,
    },
    heroBadge: {
      fontFamily: theme.fontFamilies.sansMedium,
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    heroBalance: {
      marginBottom: theme.spacing[24],
    },
    splitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[16],
      marginBottom: theme.spacing[16],
    },
    splitItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[8],
    },
    splitDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    splitLabel: {
      fontFamily: theme.fontFamilies.sansBold,
      fontSize: 10,
      color: theme.colors.textMuted,
    },
    splitValue: {
      fontSize: 14,
    },
    splitDivider: {
      width: 1,
      height: 16,
      backgroundColor: theme.colors.border,
    },
    flowBar: {
      height: 4,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.full,
      flexDirection: 'row',
      overflow: 'hidden',
    },
    flowBarIncome: {
      height: '100%',
      backgroundColor: theme.colors.success,
    },
    flowBarExpense: {
      height: '100%',
      backgroundColor: theme.colors.danger,
    },
    // KPI Grid
    kpiGrid: {
      flexDirection: 'row',
      paddingHorizontal: theme.layout.screenPadding,
      gap: theme.spacing[12],
      marginBottom: theme.spacing[32],
    },
    kpiCard: {
      flex: 1,
      padding: theme.spacing[16],
      borderRadius: theme.radius['3xl'],
      backgroundColor: theme.colors.card,
    },
    kpiHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[8],
      marginBottom: theme.spacing[12],
    },
    kpiIcon: {
      width: 28,
      height: 28,
      borderRadius: theme.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    kpiLabel: {
      fontFamily: theme.fontFamilies.sansMedium,
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    kpiValue: {
      fontSize: 18,
    },
    // Quick Actions
    quickActions: {
      flexDirection: 'row',
      paddingHorizontal: theme.layout.screenPadding,
      gap: theme.spacing[12],
      marginBottom: theme.spacing[32],
    },
    quickActionPrimary: {
      flex: 1.2,
      height: 44,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radius.full,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing[8],
    },
    quickActionPrimaryText: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 13,
      color: theme.colors.onPrimary,
    },
    quickActionSecondary: {
      flex: 1,
      height: 44,
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.full,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing[8],
    },
    quickActionSecondaryText: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 13,
      color: theme.colors.text,
    },
    // Accounts
    accountsScroll: {
      marginBottom: theme.spacing[32],
    },
    accountsScrollContent: {
      paddingHorizontal: theme.layout.screenPadding,
      paddingRight: theme.layout.screenPadding - theme.spacing[12],
      gap: theme.spacing[12],
    },
    accountCard: {
      width: screenWidth * 0.75,
      padding: theme.spacing[20],
      borderRadius: theme.radius['3xl'],
      backgroundColor: theme.colors.card,
    },
    accountCardInner: {
      gap: theme.spacing[16],
    },
    accountCardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    accountCardLead: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[12],
    },
    accountIconBox: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    accountCardMeta: {
      flex: 1,
      gap: 2,
    },
    accountCardName: {
      fontFamily: theme.fontFamilies.sansBold,
      fontSize: theme.fontSizes.md,
      color: theme.colors.text,
    },
    accountCardHint: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 10,
      color: theme.colors.textMuted,
    },
    accountCurrencyBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surface,
    },
    accountCurrencyText: {
      fontFamily: theme.fontFamilies.monoBold,
      fontSize: 10,
    },
    accountBalanceLabel: {
      fontFamily: theme.fontFamilies.sansMedium,
      fontSize: 11,
      color: theme.colors.textMuted,
    },
    accountCardBalance: {
      fontSize: 28,
      letterSpacing: -0.5,
    },
    accountCardStats: {
      flexDirection: 'row',
      gap: theme.spacing[16],
      paddingTop: theme.spacing[16],
      borderTopWidth: 1,
      borderTopColor: theme.colors.border + '50',
    },
    accountCardStatCol: {
      flex: 1,
      gap: 2,
    },
    accountCardStatLabel: {
      fontFamily: theme.fontFamilies.sansMedium,
      fontSize: 11,
      color: theme.colors.textMuted,
    },
    accountCardStatValue: {
      fontSize: 13,
    },
    accountCardStatDivider: {
      width: 1,
      height: '100%',
      backgroundColor: theme.colors.border + '50',
    },
    accountPlaceholderCard: {
      width: screenWidth * 0.75,
      height: '100%',
      borderRadius: theme.radius['3xl'],
      backgroundColor: theme.colors.card,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      borderStyle: 'dashed',
      justifyContent: 'center',
      padding: theme.spacing[24],
    },
    accountPlaceholderInner: {
      alignItems: 'center',
      gap: theme.spacing[12],
    },
    accountPlaceholderIcon: {
      width: 48,
      height: 48,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    accountPlaceholderTitle: {
      fontFamily: theme.fontFamilies.sansBold,
      fontSize: theme.fontSizes.md,
      color: theme.colors.text,
    },
    accountPlaceholderText: {
      fontFamily: theme.fontFamilies.sans,
      fontSize: 12,
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
    activityCard: {
      marginHorizontal: theme.layout.screenPadding,
      marginBottom: theme.spacing[24],
    },
    emptyActivity: {
      padding: theme.spacing[32],
      alignItems: 'center',
      gap: theme.spacing[12],
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius['3xl'],
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      borderStyle: 'dashed',
    },
    emptyActivityText: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 13,
      color: theme.colors.textMuted,
    },
    emptyActivityAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[8],
      paddingHorizontal: theme.spacing[16],
      height: 36,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.primary,
    },
    emptyActivityActionText: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 12,
      color: theme.colors.onPrimary,
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
