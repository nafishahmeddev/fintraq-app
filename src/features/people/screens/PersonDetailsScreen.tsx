import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfirmDialog } from '../../../components/core/ConfirmDialog';
import { EmptyState } from '../../../components/core/EmptyState';
import { Header } from '../../../components/core/Header';
import { MoneyText } from '../../../components/core/MoneyText';
import { OptionsDialog } from '../../../components/core/OptionsDialog';
import { useSettings } from '../../../providers/SettingsProvider';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { fromDbColor } from '../../../utils/format';
import { resolveIcon } from '../../../utils/icons';
import { useLoans } from '../../loans/api/loans';
import { TransactionListItem } from '../../transactions/api/transactions';
import { useTransactions } from '../../transactions/hooks/transactions';
import { useDeletePerson, usePersonById, usePersonSummary } from '../api/people';

const TxRow = React.memo(function TxRow({
  tx,
  onPress,
}: {
  tx: TransactionListItem;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createTxRowStyles(theme), [theme]);

  const isTransfer = tx.type === 'TRANSFER';
  const catColor = isTransfer
    ? colors.primary
    : tx.category
      ? fromDbColor(tx.category.color)
      : colors.textMuted;
  const iconName = isTransfer
    ? ('swap-horizontal-outline' as const)
    : resolveIcon(tx.category?.icon, 'pricetag-outline');
  const label = isTransfer
    ? (tx.toAccount?.name ?? 'Transfer')
    : (tx.category?.name ?? 'Transaction');

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.iconBox, { backgroundColor: catColor + '20' }]}>
        <Ionicons name={iconName} size={20} color={catColor} />
      </View>
      <View style={styles.info}>
        <Text style={styles.note} numberOfLines={1}>{tx.note || label}</Text>
        <Text style={styles.meta} numberOfLines={1}>{label} · {tx.account.name}</Text>
      </View>
      <View style={styles.right}>
        <MoneyText
          amount={tx.amount}
          currency={tx.account.currency}
          type={tx.type}
          weight="sansBold"
          style={styles.amount}
        />
        <Text style={styles.time}>{format(new Date(tx.datetime), 'MMM d')}</Text>
      </View>
    </TouchableOpacity>
  );
});

export const PersonDetailsScreen = React.memo(function PersonDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const personId = parseInt(id, 10);
  const theme = useTheme();
  const { colors } = theme;
  const { profile } = useSettings();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { data: person, isLoading: loadingPerson } = usePersonById(personId);
  const { data: summary, isLoading: loadingSummary } = usePersonSummary(personId);
  const { data: transactions, isLoading: loadingTransactions } = useTransactions(50, { personId });
  const { data: loans } = useLoans(personId);
  const { mutate: deletePerson } = useDeletePerson();

  const [showOptions, setShowOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const menuOptions = useMemo(() => [
    {
      key: 'edit',
      label: 'Edit person',
      icon: 'create-outline' as const,
      onPress: () => { setShowOptions(false); router.push(`/people/edit/${personId}`); },
    },
    {
      key: 'delete',
      label: 'Delete person',
      icon: 'trash-outline' as const,
      destructive: true,
      onPress: () => { setShowOptions(false); setShowDeleteConfirm(true); },
    },
  ], [personId, router]);

  const handleTxPress = useCallback((txId: number) => {
    router.push(`/transactions/edit/${txId}`);
  }, [router]);

  const renderItem = useCallback(({ item }: { item: TransactionListItem }) => (
    <TxRow tx={item} onPress={() => handleTxPress(item.id)} />
  ), [handleTxPress]);

  const keyExtractor = useCallback((item: TransactionListItem) => item.id.toString(), []);

  const renderHeader = useMemo(() => {
    if (!person || !summary) return null;
    const personColor = fromDbColor(person.color);
    const net = summary.netPosition;
    const netColor = net >= 0 ? colors.success : colors.danger;
    const netLabel = net === 0 ? 'Settled' : net > 0 ? 'They owe you' : 'You owe them';

    return (
      <View style={styles.headerContent}>
        <View style={styles.heroCard}>
          <View style={styles.heroIdentity}>
            <View style={[styles.avatar, { backgroundColor: personColor + '20' }]}>
              <Ionicons name={resolveIcon(person.icon, 'person-outline')} size={32} color={personColor} />
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{person.name}</Text>
              {person.phone && <Text style={styles.heroMeta}>{person.phone}</Text>}
              {person.email && <Text style={styles.heroMeta}>{person.email}</Text>}
            </View>
          </View>

          <View style={styles.sep} />

          <View style={styles.netRow}>
            <View>
              <Text style={styles.netLabel}>Net position</Text>
              <MoneyText
                amount={Math.abs(net)}
                currency={profile.defaultCurrency}
                style={[styles.netAmount, { color: netColor }]}
                weight="sansBold"
              />
            </View>
            <View style={[styles.netBadge, { backgroundColor: netColor + '18' }]}>
              <Text style={[styles.netBadgeText, { color: netColor }]}>{netLabel}</Text>
            </View>
          </View>

          <View style={styles.sep} />

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Lent</Text>
              <MoneyText
                amount={summary.remainingLent}
                currency={profile.defaultCurrency}
                style={[styles.statAmount, { color: colors.success }]}
              />
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Borrowed</Text>
              <MoneyText
                amount={summary.remainingBorrowed}
                currency={profile.defaultCurrency}
                style={[styles.statAmount, { color: colors.danger }]}
              />
            </View>
          </View>
        </View>

        {loans && loans.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Active loans</Text>
            {loans.map(loan => {
              const loanColor = fromDbColor(loan.color);
              return (
                <TouchableOpacity
                  key={loan.id}
                  style={styles.loanRow}
                  onPress={() => router.push(`/loans/details/${loan.id}`)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.loanIcon, { backgroundColor: loanColor + '20' }]}>
                    <Ionicons name={resolveIcon(loan.icon, 'cash-outline')} size={16} color={loanColor} />
                  </View>
                  <View style={styles.loanInfo}>
                    <Text style={styles.loanName}>{loan.name}</Text>
                    <Text style={styles.loanType}>{loan.type === 'LEND' ? 'Lent' : 'Borrowed'}</Text>
                  </View>
                  <MoneyText
                    amount={loan.remainingAmount}
                    currency={loan.account?.currency || profile.defaultCurrency}
                    weight="sansBold"
                    style={styles.loanAmount}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Text style={styles.sectionLabel}>Transactions</Text>
      </View>
    );
  }, [person, summary, loans, colors, profile, styles, router]);

  if (loadingPerson || loadingSummary) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!person || !summary) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Person not found" showBack />
        <EmptyState title="Not found" icon="alert-circle-outline" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={person.name}
        showBack
        rightAction={
          <TouchableOpacity onPress={() => setShowOptions(true)} activeOpacity={0.75}>
            <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
          </TouchableOpacity>
        }
      />
      <FlatList
        data={transactions}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        ListEmptyComponent={
          !loadingTransactions ? (
            <EmptyState title="No transactions" icon="receipt-outline" />
          ) : null
        }
      />
      <OptionsDialog
        visible={showOptions}
        onClose={() => setShowOptions(false)}
        title="Person options"
        subtitle={person.name}
        options={menuOptions}
      />
      <ConfirmDialog
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete person"
        message="Delete this person? Linked transactions and loans will remain but won't be associated with them."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          deletePerson(personId);
          setShowDeleteConfirm(false);
          router.back();
        }}
      />
    </SafeAreaView>
  );
});

const createTxRowStyles = (theme: Theme) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing[16],
    gap: theme.spacing[12],
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['3xl'],
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: theme.spacing[2],
  },
  note: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text,
  },
  meta: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textMuted,
  },
  right: {
    alignItems: 'flex-end',
    gap: theme.spacing[4],
  },
  amount: {
    fontSize: theme.fontSizes.sm,
  },
  time: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
});

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  listContent: {
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: theme.spacing[16],
    paddingBottom: 40,
    gap: theme.spacing[8],
  },
  headerContent: {
    gap: theme.spacing[16],
    marginBottom: theme.spacing[8],
  },
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['3xl'],
    padding: theme.spacing[20],
    gap: theme.spacing[16],
  },
  heroIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[16],
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroInfo: {
    flex: 1,
    gap: 2,
  },
  heroName: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: theme.fontSizes.lg,
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  heroMeta: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  sep: {
    height: 1,
    backgroundColor: theme.colors.overlay,
  },
  netRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netLabel: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  netAmount: {
    fontSize: 32,
    letterSpacing: -1,
  },
  netBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.radius.full,
  },
  netBadgeText: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing[8],
  },
  statBox: {
    flex: 1,
    gap: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.overlay,
    alignSelf: 'stretch',
  },
  statLabel: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  statAmount: {
    fontSize: 15,
  },
  section: {
    gap: theme.spacing[8],
  },
  sectionLabel: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 12,
    color: theme.colors.textMuted,
    paddingLeft: 4,
  },
  loanRow: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['3xl'],
    padding: theme.spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[12],
  },
  loanIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loanInfo: {
    flex: 1,
    gap: 2,
  },
  loanName: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 14,
    color: theme.colors.text,
  },
  loanType: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  loanAmount: {
    fontSize: 14,
  },
});
