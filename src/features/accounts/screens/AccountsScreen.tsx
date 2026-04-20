import { resolveIcon } from '@/src/utils/icons';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Header } from '../../../components/ui/Header';
import { MoneyText } from '../../../components/ui/MoneyText';
import { OptionsDialog } from '../../../components/ui/OptionsDialog';
import { DEFAULT_CURRENCY } from '../../../constants/currency';
import { useTheme } from '../../../providers/ThemeProvider';
import { ThemeColors } from '../../../theme/colors';
import { LAYOUT, RADIUS, SPACING } from '../../../theme/tokens';
import { TYPOGRAPHY } from '../../../theme/typography';
import { toErrorMessage } from '../../../utils/errors';
import type { Account } from '../api/accounts';
import { AccountFormModal } from '../components/AccountFormModal';
import { useAccounts, useDeleteAccount } from '../hooks/accounts';

const hexColor = (raw: number) => `#${raw.toString(16).padStart(6, '0')}`;

export const AccountsScreen = React.memo(function AccountsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  const { data: accounts, isLoading } = useAccounts();
  const { mutateAsync: deleteAccount } = useDeleteAccount();

  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | undefined>(undefined);
  const [showOptions, setShowOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeAccount, setActiveAccount] = useState<Account | undefined>(undefined);

  const currencySummary = useMemo(() => {
    if (!accounts) return [];
    const map = new Map<string, { balance: number; count: number }>();
    for (const acc of accounts) {
      const entry = map.get(acc.currency);
      if (entry) {
        entry.balance += acc.balance;
        entry.count += 1;
      } else {
        map.set(acc.currency, { balance: acc.balance, count: 1 });
      }
    }
    return Array.from(map.entries()).map(([currency, data]) => ({ currency, ...data }));
  }, [accounts]);

  const currencyKeys = useMemo(() => {
    return currencySummary.map(s => s.currency);
  }, [currencySummary]);

  const [selectedCurrency, setSelectedCurrency] = useState<string>(currencyKeys[0] ?? DEFAULT_CURRENCY);

  React.useEffect(() => {
    if (currencyKeys.length > 0 && !currencyKeys.includes(selectedCurrency)) {
      setSelectedCurrency(currencyKeys[0]);
    }
  }, [currencyKeys, selectedCurrency]);

  const openAddForm = useCallback(() => {
    setEditingAccount(undefined);
    setShowForm(true);
  }, []);

  const closeForm = useCallback(() => setShowForm(false), []);
  const closeOptions = useCallback(() => setShowOptions(false), []);
  const closeDeleteConfirm = useCallback(() => setShowDeleteConfirm(false), []);

  const handleLongPress = useCallback((account: Account) => {
    setActiveAccount(account);
    setShowOptions(true);
  }, []);

  const handleAccountPress = useCallback(
    (accountId: number) => {
      router.push(`/transactions?accountId=${accountId}`);
    },
    [router],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!activeAccount) return;
    try {
      await deleteAccount(activeAccount.id);
      setActiveAccount(undefined);
    } catch (e) {
      Alert.alert('Error', toErrorMessage(e, 'Failed to delete account.'));
    }
  }, [activeAccount, deleteAccount]);

  const accountOptions = useMemo(() => {
    if (!activeAccount) return [];
    return [
      {
        key: 'edit',
        label: 'Edit account',
        icon: 'create-outline' as const,
        onPress: () => {
          setEditingAccount(activeAccount);
          setShowForm(true);
        },
      },
      {
        key: 'delete',
        label: 'Delete account',
        icon: 'trash-outline' as const,
        destructive: true,
        onPress: () => setShowDeleteConfirm(true),
      },
    ];
  }, [activeAccount]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Accounts"
        subtitle="Wallets & balances"
        rightAction={
          <TouchableOpacity style={styles.addButton} onPress={openAddForm} activeOpacity={0.85}>
            <Ionicons name="add" size={20} color={colors.text} />
          </TouchableOpacity>
        }
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
                onPress={() => setSelectedCurrency(curr)}
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

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Net Worth for Selected Currency ── */}
        {(() => {
          const selectedSummary = currencySummary.find(s => s.currency === selectedCurrency);
          if (!selectedSummary) return null;
          return (
            <>
              <Text style={styles.sectionLabel}>NET WORTH ({selectedCurrency})</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                  <MoneyText
                    amount={Math.abs(selectedSummary.balance)}
                    currency={selectedSummary.currency}
                    style={styles.summaryCardBalance}
                    weight="bold"
                  />
                  <Text style={styles.summaryCardCount}>
                    {selectedSummary.count} {selectedSummary.count === 1 ? 'account' : 'accounts'}
                  </Text>
                </View>
              </View>
            </>
          );
        })()}

        <View style={styles.listHeader}>
          <Text style={styles.sectionLabel}>ALL ACCOUNTS</Text>
          <Text style={styles.listHint}>{accounts?.length ?? 0} total</Text>
        </View>

        {accounts && accounts.length > 0 ? (
          <View style={styles.accountList}>
            {accounts.map((account, index) => (
              <React.Fragment key={account.id}>
                <AccountCard
                  account={account}
                  accentColor={hexColor(account.color)}
                  onPress={handleAccountPress}
                  onLongPress={handleLongPress}
                  styles={styles}
                  colors={colors}
                />
                {index < accounts.length - 1 && (
                  <View style={styles.cardDivider} />
                )}
              </React.Fragment>
            ))}
          </View>
        ) : (
          <EmptyState
            icon="wallet-outline"
            title="No accounts yet"
            description="Add your first account to start tracking your balances and transactions."
            actionLabel="Add account"
            onAction={openAddForm}
            size="default"
            variant="card"
          />
        )}
      </ScrollView>

      <AccountFormModal visible={showForm} onClose={closeForm} account={editingAccount} />

      <OptionsDialog
        visible={showOptions}
        onClose={closeOptions}
        title="Manage account"
        subtitle={activeAccount?.name}
        options={accountOptions}
      />

      <ConfirmDialog
        visible={showDeleteConfirm}
        onClose={closeDeleteConfirm}
        title="Delete account"
        message={
          activeAccount
            ? `Delete "${activeAccount.name}"? This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteConfirm}
      />
    </View>
  );
});

type AccountCardProps = {
  account: Account;
  accentColor: string;
  onPress: (id: number) => void;
  onLongPress: (account: Account) => void;
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
};

const AccountCard = React.memo(function AccountCard({
  account,
  accentColor,
  onPress,
  onLongPress,
  styles,
  colors,
}: AccountCardProps) {
  const handlePress = useCallback(() => onPress(account.id), [onPress, account.id]);
  const handleLongPress = useCallback(() => onLongPress(account), [onLongPress]);

  return (
    <TouchableOpacity
      style={styles.accountCard}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={250}
      activeOpacity={0.85}
    >
      <View style={[styles.accountAccent, { backgroundColor: accentColor }]} />

      <View style={styles.accountInner}>
        {/* ── Top Row: Icon + Name + Currency ── */}
        <View style={styles.accountTop}>
          <View style={[styles.accountIconBox, { backgroundColor: accentColor + '20' }]}>
            <Ionicons
              name={resolveIcon(account.icon, 'wallet-outline')}
              size={LAYOUT.iconMd}
              color={accentColor}
            />
          </View>
          <View style={styles.accountMeta}>
            <Text style={styles.accountName} numberOfLines={1}>
              {account.name}
            </Text>
            <Text style={styles.accountSub} numberOfLines={1}>
              {account.holderName
                ? account.holderName
                : account.accountNumber && account.accountNumber !== 'N/A'
                  ? `•••• ${account.accountNumber.slice(-4)}`
                  : 'Tap to view activity'}
            </Text>
          </View>
          <View style={[styles.currencyBadge, { borderColor: accentColor + '40' }]}>
            <Text style={[styles.currencyBadgeText, { color: accentColor }]}>
              {account.currency}
            </Text>
          </View>
        </View>

        <View style={[styles.accountDivider, { backgroundColor: colors.border }]} />

        {/* ── Balance: Full width, never shrinks ── */}
        <View style={styles.accountBalanceRow}>
          <MoneyText
            amount={account.balance}
            currency={account.currency}
            style={styles.accountBalance}
            weight="bold"
          />
        </View>

        {/* ── Stats: IN/OUT below balance ── */}
        <View style={styles.accountStatsRow}>
          <View style={styles.accountStatBox}>
            <Text style={styles.accountStatLabel}>TOTAL IN</Text>
            <MoneyText
              amount={account.income}
              currency={account.currency}
              style={styles.accountStatValue}
              type="CR"
              showSign={true}
            />
          </View>
          <View style={[styles.accountStatDivider, { backgroundColor: colors.text + '10' }]} />
          <View style={styles.accountStatBox}>
            <Text style={styles.accountStatLabel}>TOTAL OUT</Text>
            <MoneyText
              amount={account.expense}
              currency={account.currency}
              style={styles.accountStatValue}
              type="DR"
              showSign={true}
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      overflow: 'hidden',
      paddingTop: StatusBar.currentHeight,
    },
    loading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: LAYOUT.screenPadding,
      paddingBottom: SPACING['11'],
    },
    /* ── Global Currency Picker ── */
    currencyPickerContainer: {
      marginHorizontal: LAYOUT.screenPadding,
      marginBottom: SPACING['3'],
    },
    currencyTabsRow: {
      flexDirection: 'row',
      gap: SPACING['1'],
    },
    currencyTab: {
      paddingHorizontal: SPACING['3'],
      paddingVertical: SPACING['1'],
      borderRadius: RADIUS.md,
    },
    currencyTabText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 11,
      letterSpacing: 0.4,
    },
    sectionLabel: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 1.5,
      marginBottom: SPACING['2'],
    },
    summaryRow: {
      flexDirection: 'row',
      gap: SPACING['2'],
      marginBottom: SPACING['6'],
    },
    summaryCard: {
      flex: 1,
      borderRadius: RADIUS.lg,
      backgroundColor: colors.surface,
      padding: SPACING['3.5'],
    },
    summaryCardCurrency: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 1.2,
      marginBottom: SPACING['1'],
    },
    summaryCardBalance: {
      fontSize: 20,
      lineHeight: 24,
      letterSpacing: -0.5,
      marginBottom: SPACING['1'],
    },
    summaryCardCount: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 11,
      color: colors.textMuted,
    },
    listHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING['2'],
    },
    listHint: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 11,
      color: colors.textMuted,
    },
    accountList: {
      borderRadius: RADIUS.xl,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    cardDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: SPACING['4'],
    },
    accountCard: {
      flexDirection: 'row',
    },
    accountAccent: {
      width: 3,
    },
    accountInner: {
      flex: 1,
      padding: SPACING['4'],
    },
    accountTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING['3'],
      marginBottom: SPACING['3'],
    },
    accountIconBox: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    accountMeta: {
      flex: 1,
    },
    accountName: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 15,
      color: colors.text,
      letterSpacing: -0.2,
    },
    accountSub: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
      marginTop: SPACING['0.5'],
    },
    currencyBadge: {
      paddingHorizontal: SPACING['2'],
      paddingVertical: SPACING['0.5'],
      borderRadius: RADIUS.md,
    },
    currencyBadgeText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 10,
      letterSpacing: 0.5,
    },
    accountDivider: {
      height: 1,
      marginVertical: SPACING['3'],
    },
    /* ── Balance: Full width, never shrinks ── */
    accountBalanceRow: {
      marginBottom: SPACING['3'],
    },
    accountBalance: {
      fontSize: 28,
      lineHeight: 32,
      letterSpacing: -1,
    },
    /* ── Stats: IN/OUT in a row below balance ── */
    accountStatsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING['3'],
    },
    accountStatBox: {
      flex: 1,
      alignItems: 'flex-start',
    },
    accountStatLabel: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 9,
      color: colors.textMuted,
      letterSpacing: 1,
      marginBottom: SPACING['1'],
    },
    accountStatValue: {
      fontSize: 14,
    },
    accountStatDivider: {
      width: 1,
      height: 32,
      backgroundColor: colors.border,
    },
    addButton: {
      width: 36,
      height: 36,
      borderRadius: RADIUS.full,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
