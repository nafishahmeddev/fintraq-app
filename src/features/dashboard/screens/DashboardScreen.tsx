import { usePremium } from '@/src/providers/PremiumProvider';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { ActivityIndicator, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Header } from '../../../components/ui/Header';
import { MoneyText } from '../../../components/ui/MoneyText';
import { OptionsDialog } from '../../../components/ui/OptionsDialog';
import { TransactionRow } from '../../../components/ui/TransactionRow';
import { DEFAULT_CURRENCY } from '../../../constants/currency';
import { useSettings } from '../../../providers/SettingsProvider';
import { useTheme } from '../../../providers/ThemeProvider';
import { ThemeColors } from '../../../theme/colors';
import { radius, spacing } from '../../../theme/tokens';
import { TYPOGRAPHY } from '../../../theme/typography';
import type { Account } from '../../accounts/api/accounts';
import { AccountFormModal } from '../../accounts/components/AccountFormModal';
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
  const styles = React.useMemo(() => createStyles(colors, screenWidth), [colors, screenWidth]);
  const router = useRouter();

  const { data: transactions, isLoading: txLoading } = useTransactions(6);
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { mutateAsync: deleteAccount } = useDeleteAccount();

  const [showAccountForm, setShowAccountForm] = React.useState(false);
  const [editingAccount, setEditingAccount] = React.useState<Account | undefined>(undefined);
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
  const topExpenseCategories = React.useMemo(() => topCategoriesData ?? [], [topCategoriesData]);

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

  const navigateToPremium = useCallback(() => {
    router.push('/premium');
  }, [router]);

  const navigateToTransactions = useCallback(() => {
    router.push('/transactions');
  }, [router]);

  const navigateToAccountTransactions = useCallback((accountId: number) => {
    router.push(`/transactions?accountId=${accountId}`);
  }, [router]);

  const navigateToEditTransaction = useCallback((txId: number) => {
    router.push(`/transactions/edit/${txId}`);
  }, [router]);

  const openAccountForm = useCallback(() => {
    setEditingAccount(undefined);
    setShowAccountForm(true);
  }, []);

  const closeAccountForm = useCallback(() => {
    setShowAccountForm(false);
  }, []);

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
          setEditingAccount(activeAccount);
          setShowAccountForm(true);
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
  }, [activeAccount]);

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
    <View style={styles.container}>
      {/* Static background circles - subtle in dark mode */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View style={[styles.bgCircle, {
          top: -60,
          left: -60,
          width: 340,
          height: 340,
          backgroundColor: colors.primary
        }]} />
        <View style={[styles.bgCircle, {
          top: 180,
          right: -110,
          width: 440,
          height: 440,
          backgroundColor: colors.primaryDark
        }]} />
        <View style={[styles.bgCircle, {
          bottom: -110,
          left: 40,
          width: 380,
          height: 380,
          backgroundColor: colors.primary
        }]} />
      </View>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.background }]} pointerEvents="none" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Refined Header ── */}
        <Header
          title="Dashboard"
          subtitle={`${getGreeting()}${profile.name ? `, ${profile.name.split(' ')[0]}` : ''}`}
          rightAction={(
            <View style={styles.headerActions}>
              {/* All Transactions */}
              <TouchableOpacity
                style={styles.iconButton}
                onPress={navigateToTransactions}
                activeOpacity={0.85}
              >
                <Ionicons name="list-outline" size={18} color={colors.text} />
              </TouchableOpacity>
              {/* Search - Pro feature, not in bottom nav */}
              <TouchableOpacity
                style={styles.iconButton}
                onPress={isPremium ? navigateToSearch : navigateToPremium}
                activeOpacity={0.85}
              >
                <Ionicons name="search-outline" size={18} color={isPremium ? colors.text : colors.textMuted} />
                {!isPremium && <View style={[styles.proDot, { backgroundColor: colors.primary }]} />}
              </TouchableOpacity>
            </View>
          )}
        />

        {/* ── Global Currency Picker ── */}
        {currencyKeys.length > 1 && (
          <View style={styles.currencyPickerContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.currencyTabsRow}
            >
              {currencyKeys.map(curr => (
                <TouchableOpacity
                  key={curr}
                  style={[
                    styles.currencyTab, 
                    selectedCurrency === curr && { backgroundColor: colors.text }
                  ]}
                  onPress={() => handleCurrencySelect(curr)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.currencyTabText, 
                    { color: selectedCurrency === curr ? colors.background : colors.textMuted }
                  ]}>
                    {curr}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Hero balance card ── */}
        <View style={[styles.heroCard, { backgroundColor: colors.surface }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing('1') }}>
            <Text style={[styles.heroBadge, { color: colors.textMuted }]}>TOTAL BALANCE</Text>
            <StreakBadge />
          </View>
          <MoneyText
            amount={balancesByCurrency[selectedCurrency] || 0}
            currency={selectedCurrency}
            style={[styles.heroBalance, { color: colors.text }]}
            weight="bold"
          />

          {/* Income / Expense split bar */}
          <View style={styles.splitRow}>
            <View style={styles.splitItem}>
              <View style={[styles.splitDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.splitLabel, { color: colors.textMuted }]}>IN</Text>
              <MoneyText amount={totals.income} currency={selectedCurrency} type="CR" weight="bold" style={styles.splitValue} showSign={false} />
            </View>
            <View style={[styles.splitDivider, { backgroundColor: colors.border }]} />
            <View style={styles.splitItem}>
              <View style={[styles.splitDot, { backgroundColor: colors.danger }]} />
              <Text style={[styles.splitLabel, { color: colors.textMuted }]}>OUT</Text>
              <MoneyText amount={totals.expense} currency={selectedCurrency} type="DR" weight="bold" style={styles.splitValue} showSign={false} />
            </View>
          </View>

          {/* Visual bar */}
          <View style={styles.flowBar}>
            <View style={[styles.flowBarIncome, { flex: incomeBarRatio, backgroundColor: colors.success }]} />
            <View style={[styles.flowBarExpense, { flex: 1 - incomeBarRatio, backgroundColor: colors.danger }]} />
          </View>
        </View>

        {/* ── Insights Layer (Pro Only) ── */}
        <InsightsSection currency={selectedCurrency} />

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
                style={[styles.accountCard, { backgroundColor: colors.surface }]}
                onPress={() => navigateToAccountTransactions(acc.id)}
                onLongPress={() => handleAccountLongPress(acc)}
                delayLongPress={250}
                activeOpacity={0.88}
              >
                <View style={[styles.accountAccentBar, { backgroundColor: accColor }]} />

                <View style={styles.accountCardInner}>
                  <View style={styles.accountCardTop}>
                    <View style={styles.accountCardLead}>
                      <View style={[styles.accountIconBox, { backgroundColor: accColor + '20' }]}>
                        <Ionicons name={resolveIconName(acc.icon, 'wallet-outline')} size={18} color={accColor} />
                      </View>
                      <View style={styles.accountCardMeta}>
                        <Text style={[styles.accountCardName, { color: colors.text }]} numberOfLines={1}>{acc.name}</Text>
                        <Text style={[styles.accountCardHint, { color: colors.textMuted }]}>
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

                  <Text style={[styles.accountBalanceLabel, { color: colors.textMuted }]}>AVAILABLE</Text>
                  <MoneyText amount={acc.balance} currency={acc.currency} style={[styles.accountCardBalance, { color: colors.text }]} weight="bold" />

                  <View style={styles.accountCardStats}>
                    <View style={styles.accountCardStatCol}>
                      <Text style={[styles.accountCardStatLabel, { color: colors.textMuted }]}>TOTAL IN</Text>
                      <MoneyText amount={acc.income} currency={acc.currency} style={styles.accountCardStatValue} type="CR" showSign={true} />
                    </View>
                    <View style={[styles.accountCardStatDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.accountCardStatCol}>
                      <Text style={[styles.accountCardStatLabel, { color: colors.textMuted }]}>TOTAL OUT</Text>
                      <MoneyText amount={acc.expense} currency={acc.currency} style={styles.accountCardStatValue} type="DR" showSign={true} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={[styles.accountPlaceholderCard, { backgroundColor: colors.surface }]}
            onPress={openAccountForm}
            activeOpacity={0.88}
          >
            <View style={styles.accountPlaceholderInner}>
              <View style={[styles.accountPlaceholderIcon, { backgroundColor: colors.surface }]}>
                <Ionicons name="add" size={22} color={colors.text} />
              </View>
              <Text style={[styles.accountPlaceholderTitle, { color: colors.text }]}>New Account</Text>
              <Text style={[styles.accountPlaceholderText, { color: colors.textMuted }]}>Add another wallet, bank, or cash account.</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* ── Top expense categories ── */}
        <SectionHeader title="TOP EXPENSE CATEGORIES" rightText={selectedCurrency} />
        <TopExpenseCategoriesCard
          currency={selectedCurrency}
          categories={topExpenseCategories}
        />

        {/* ── Recent activity ── */}
        <SectionHeader title="RECENT" rightText="See all" onPressRight={navigateToTransactions} />

        <View style={[styles.activityCard, { backgroundColor: colors.surface }]}>
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
            <EmptyState
              icon="receipt-outline"
              title="No transactions yet"
              description="Start tracking your spending by adding your first transaction."
              actionLabel="Add Transaction"
              onAction={navigateToTransactions}
              size="compact"
              variant="card"
              fullHeight={false}
            />
          )}
        </View>

      </ScrollView>

      <AccountFormModal
        visible={showAccountForm}
        onClose={closeAccountForm}
        account={editingAccount}
      />

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
    </View>
  );
});

const createStyles = (colors: ThemeColors, screenWidth: number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
    paddingTop: StatusBar.currentHeight
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: 999,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing('10'),
  },

  /* ── Header actions ── */
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('2'),
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radius('full'),
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  proDot: {
    position: 'absolute',
    top: spacing('1'),
    right: spacing('1'),
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  /* ── Global Currency Picker ── */
  currencyPickerContainer: {
    marginHorizontal: spacing('6'),
    marginBottom: spacing('3'),
  },
  currencyTabsRow: {
    flexDirection: 'row',
    gap: spacing('1'),
  },

  /* ── Hero balance card ── */
  heroCard: {
    marginHorizontal: spacing('6'),
    marginBottom: spacing('4'),
    borderRadius: radius('2xl'),
    padding: spacing('5'),
    overflow: 'hidden',
  },
  currencyTab: {
    paddingHorizontal: spacing('3'),
    paddingVertical: spacing('1.5'),
    borderRadius: radius('full'),
    backgroundColor: colors.card,
  },
  currencyTabText: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 11,
    letterSpacing: 0.4,
  },
  heroBadge: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: spacing('1.5'),
  },
  heroBalance: {
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -1,
    marginBottom: spacing('5'),
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing('3'),
  },
  splitItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('1.5'),
  },
  splitDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  splitLabel: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  splitValue: {
    fontSize: 13,
  },
  splitDivider: {
    width: 1,
    height: 28,
    marginHorizontal: spacing('3.5'),
  },
  flowBar: {
    flexDirection: 'row',
    height: 4,
    borderRadius: radius('full'),
    overflow: 'hidden',
    gap: spacing('0.5'),
  },
  flowBarIncome: {
    borderRadius: radius('full'),
  },
  flowBarExpense: {
    borderRadius: radius('full'),
  },

  /* ── Accounts carousel ── */
  accountsScroll: {
    paddingLeft: spacing('6'),
    marginBottom: spacing('6'),
  },
  accountsScrollContent: {
    paddingRight: spacing('8'),
    gap: spacing('3'),
  },
  accountCard: {
    width: screenWidth * 0.7,
    minHeight: 160,
    borderRadius: radius('xl'),
    overflow: 'hidden',
  },
  accountPlaceholderCard: {
    width: screenWidth * 0.7,
    minHeight: 160,
    borderRadius: radius('xl'),
    overflow: 'hidden',
  },
  accountPlaceholderInner: {
    flex: 1,
    minHeight: 157,
    padding: spacing('5'),
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  accountPlaceholderIcon: {
    width: 40,
    height: 40,
    borderRadius: radius('md'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing('4'),
  },
  accountPlaceholderTitle: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 16,
    marginBottom: spacing('1.5'),
  },
  accountPlaceholderText: {
    fontFamily: TYPOGRAPHY.fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    maxWidth: 180,
  },
  accountAccentBar: {
    height: 3,
    width: '100%',
  },
  accountCardInner: {
    padding: spacing('3.5'),
  },
  accountCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing('3'),
    gap: spacing('2.5'),
  },
  accountCardLead: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('2.5'),
  },
  accountIconBox: {
    width: 40,
    height: 40,
    borderRadius: radius('md'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountCardMeta: {
    flex: 1,
  },
  accountCardName: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 14,
  },
  accountCardHint: {
    fontFamily: TYPOGRAPHY.fonts.regular,
    fontSize: 11,
    marginTop: spacing('0.5'),
  },
  accountCurrencyBadge: {
    height: 24,
    minWidth: 48,
    paddingHorizontal: spacing('2'),
    borderRadius: radius('full'),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  accountCurrencyText: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  accountBalanceLabel: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 9,
    letterSpacing: 1.2,
    marginBottom: spacing('1.5'),
  },
  accountCardBalance: {
    fontSize: 22,
    lineHeight: 25,
    marginBottom: spacing('3'),
  },
  accountCardStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountCardStatCol: {
    flex: 1,
    gap: spacing('1'),
  },
  accountCardStatLabel: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 8,
    letterSpacing: 1,
  },
  accountCardStatValue: {
    fontSize: 11,
  },
  accountCardStatDivider: {
    width: 1,
    height: 20,
    marginHorizontal: spacing('3'),
  },

  /* ── Recent activity ── */
  activityCard: {
    marginHorizontal: spacing('6'),
    borderRadius: radius('xl'),
    overflow: 'hidden',
  },
});
