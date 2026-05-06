import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { Header } from '../../src/components/ui/Header';
import { MoneyText } from '../../src/components/ui/MoneyText';
import { OptionsDialog } from '../../src/components/ui/OptionsDialog';
import type { Account } from '../../src/features/accounts/api/accounts';
import { useAccounts, useDeleteAccount } from '../../src/features/accounts/hooks/accounts';
import { Theme, useTheme } from '../../src/providers/ThemeProvider';
import { resolveIcon } from '../../src/utils/icons';

export default function AccountsTab() {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();

  const { data: accounts, isLoading } = useAccounts();
  const { mutateAsync: deleteAccount } = useDeleteAccount();

  const [showOptions, setShowOptions] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [activeAccount, setActiveAccount] = useState<Account | undefined>();

  const handleLongPress = useCallback((acc: Account) => {
    setActiveAccount(acc);
    setShowOptions(true);
  }, []);

  const closeOptions = useCallback(() => setShowOptions(false), []);
  const closeDelete = useCallback(() => setShowDelete(false), []);

  const handleDelete = useCallback(() => {
    if (!activeAccount) return;
    deleteAccount(activeAccount.id);
    setActiveAccount(undefined);
  }, [activeAccount, deleteAccount]);

  const accountOptions = useMemo(() => {
    if (!activeAccount) return [];
    return [
      {
        key: 'edit',
        label: 'Edit account',
        icon: 'create-outline' as const,
        onPress: () => {
          closeOptions();
          router.push(`/accounts/edit/${activeAccount.id}`);
        },
      },
      {
        key: 'delete',
        label: 'Delete account',
        icon: 'trash-outline' as const,
        destructive: true,
        onPress: () => setShowDelete(true),
      },
    ];
  }, [activeAccount, closeOptions, router]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Accounts" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {accounts?.map((acc) => {
          const accColor = '#' + acc.color.toString(16).padStart(6, '0');
          return (
            <TouchableOpacity
              key={acc.id}
              style={styles.card}
              onPress={() => router.push(`/transactions?accountId=${acc.id}`)}
              onLongPress={() => handleLongPress(acc)}
              delayLongPress={250}
              activeOpacity={0.88}
            >
              <View style={styles.cardTop}>
                <View style={[styles.iconBox, { backgroundColor: accColor + '20' }]}>
                  <Ionicons name={resolveIcon(acc.icon, 'wallet-outline')} size={20} color={accColor} />
                </View>
                <View style={styles.cardMeta}>
                  <Text style={styles.cardName}>{acc.name}</Text>
                  <Text style={styles.cardHint}>
                    {acc.accountNumber && acc.accountNumber !== 'N/A'
                      ? `•••• ${acc.accountNumber.slice(-4)}`
                      : 'Tap to view activity'}
                  </Text>
                </View>
                <View style={[styles.currencyBadge, { borderColor: accColor }]}>
                  <Text style={[styles.currencyText, { color: accColor }]}>{acc.currency}</Text>
                </View>
              </View>

              <MoneyText
                amount={acc.balance}
                currency={acc.currency}
                style={styles.balance}
                weight="sansBold"
              />

              <View style={styles.statsRow}>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Income</Text>
                  <MoneyText amount={acc.income} currency={acc.currency} type="CR" style={styles.statValue} />
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Expense</Text>
                  <MoneyText amount={acc.expense} currency={acc.currency} type="DR" style={styles.statValue} />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={styles.addCard}
          onPress={() => router.push('/accounts/create')}
          activeOpacity={0.88}
        >
          <View style={styles.addIcon}>
            <Ionicons name="add" size={24} color={colors.text} />
          </View>
          <Text style={styles.addTitle}>New account</Text>
          <Text style={styles.addText}>Add another wallet, bank, or cash account.</Text>
        </TouchableOpacity>
      </ScrollView>

      <OptionsDialog
        visible={showOptions}
        onClose={closeOptions}
        title="Manage Account"
        subtitle={activeAccount?.name}
        options={accountOptions}
      />

      <ConfirmDialog
        visible={showDelete}
        onClose={closeDelete}
        title="Delete Account"
        message={activeAccount ? `Delete ${activeAccount.name}? This cannot be undone.` : undefined}
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: theme.layout.screenPadding,
    paddingBottom: 32,
    gap: theme.spacing[12],
  },
  card: {
    padding: theme.spacing[20],
    borderRadius: theme.radius['3xl'],
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[12],
    marginBottom: theme.spacing[16],
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMeta: {
    flex: 1,
  },
  cardName: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: theme.fontSizes.md,
    color: theme.colors.text,
  },
  cardHint: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  currencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
  },
  currencyText: {
    fontFamily: theme.fontFamilies.monoBold,
    fontSize: 10,
  },
  balance: {
    fontSize: 28,
    letterSpacing: -0.5,
    marginBottom: theme.spacing[16],
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing[16],
    paddingTop: theme.spacing[16],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border + '50',
  },
  statCol: {
    flex: 1,
    gap: 2,
  },
  statLabel: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  statValue: {
    fontSize: 13,
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.border + '50',
  },
  addCard: {
    alignItems: 'center',
    gap: theme.spacing[8],
    padding: theme.spacing[24],
    borderRadius: theme.radius['3xl'],
    backgroundColor: theme.colors.card,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  addIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  addTitle: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: theme.fontSizes.md,
    color: theme.colors.text,
  },
  addText: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
    maxWidth: 220,
  },
});
