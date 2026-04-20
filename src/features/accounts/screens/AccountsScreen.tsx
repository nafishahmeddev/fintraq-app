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
import { BlurBackground } from '../../../components/ui/BlurBackground';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Header } from '../../../components/ui/Header';
import { MoneyText } from '../../../components/ui/MoneyText';
import { OptionsDialog } from '../../../components/ui/OptionsDialog';
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
      <BlurBackground />

      <Header
        title="Accounts"
        subtitle="Wallets & balances"
        rightAction={
          <TouchableOpacity style={styles.addButton} onPress={openAddForm} activeOpacity={0.8}>
            <Ionicons name="add" size={18} color={colors.background} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {currencySummary.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>NET WORTH</Text>
            <View style={styles.summaryRow}>
              {currencySummary.map(({ currency, balance, count }) => (
                <View key={currency} style={styles.summaryCard}>
                  <Text style={styles.summaryCardCurrency}>{currency}</Text>
                  <MoneyText
                    amount={Math.abs(balance)}
                    currency={currency}
                    style={styles.summaryCardBalance}
                    weight="bold"
                  />
                  <Text style={styles.summaryCardCount}>
                    {count} {count === 1 ? 'account' : 'accounts'}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.listHeader}>
          <Text style={styles.sectionLabel}>ALL ACCOUNTS</Text>
          <Text style={styles.listHint}>{accounts?.length ?? 0} total</Text>
        </View>

        {accounts && accounts.length > 0 ? (
          <View style={styles.accountList}>
            {accounts.map((account, index) => (
              <AccountCard
                key={account.id}
                account={account}
                accentColor={hexColor(account.color)}
                isLast={index === accounts.length - 1}
                onPress={handleAccountPress}
                onLongPress={handleLongPress}
                styles={styles}
                colors={colors}
              />
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
  isLast: boolean;
  onPress: (id: number) => void;
  onLongPress: (account: Account) => void;
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
};

const AccountCard = React.memo(function AccountCard({
  account,
  accentColor,
  isLast,
  onPress,
  onLongPress,
  styles,
  colors,
}: AccountCardProps) {
  const handlePress = useCallback(() => onPress(account.id), [onPress, account.id]);
  const handleLongPress = useCallback(() => onLongPress(account), [onLongPress, account]);

  return (
    <TouchableOpacity
      style={[styles.accountCard, isLast && styles.accountCardLast]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={250}
      activeOpacity={0.85}
    >
      <View style={[styles.accountAccent, { backgroundColor: accentColor }]} />

      <View style={styles.accountInner}>
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

        <View style={[styles.accountDivider, { backgroundColor: colors.text + '08' }]} />

        <View style={styles.accountBottom}>
          <View style={styles.accountBalanceCol}>
            <Text style={styles.accountBalanceLabel}>BALANCE</Text>
            <MoneyText
              amount={account.balance}
              currency={account.currency}
              style={styles.accountBalance}
              weight="bold"
            />
          </View>
          <View style={styles.accountStats}>
            <View style={styles.accountStatItem}>
              <Text style={styles.accountStatLabel}>IN</Text>
              <MoneyText
                amount={account.income}
                currency={account.currency}
                style={styles.accountStatValue}
                type="CR"
              />
            </View>
            <View style={[styles.accountStatDivider, { backgroundColor: colors.text + '10' }]} />
            <View style={styles.accountStatItem}>
              <Text style={styles.accountStatLabel}>OUT</Text>
              <MoneyText
                amount={account.expense}
                currency={account.currency}
                style={styles.accountStatValue}
                type="DR"
              />
            </View>
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
      borderWidth: 1,
      borderColor: colors.border,
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
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    accountCard: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.text + '08',
    },
    accountCardLast: {
      borderBottomWidth: 0,
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
      width: SPACING['10'],
      height: SPACING['10'],
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
      borderWidth: 1,
    },
    currencyBadgeText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 10,
      letterSpacing: 0.5,
    },
    accountDivider: {
      height: 1,
      marginBottom: SPACING['3'],
    },
    accountBottom: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING['4'],
    },
    accountBalanceCol: {
      flex: 1,
    },
    accountBalanceLabel: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 9,
      color: colors.textMuted,
      letterSpacing: 1,
      marginBottom: SPACING['1'],
    },
    accountBalance: {
      fontSize: 22,
      lineHeight: 26,
      letterSpacing: -0.6,
    },
    accountStats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING['3'],
    },
    accountStatItem: {
      alignItems: 'flex-end',
    },
    accountStatLabel: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 9,
      color: colors.textMuted,
      letterSpacing: 1,
      marginBottom: SPACING['0.5'],
    },
    accountStatValue: {
      fontSize: 13,
    },
    accountStatDivider: {
      width: 1,
      height: 28,
    },
    addButton: {
      width: LAYOUT.minTouchTarget - 8,
      height: LAYOUT.minTouchTarget - 8,
      borderRadius: RADIUS.md,
      backgroundColor: colors.text,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
