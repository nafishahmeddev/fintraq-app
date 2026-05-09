import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfirmDialog } from '../../../components/core/ConfirmDialog';
import { EmptyState } from '../../../components/core/EmptyState';
import { Header } from '../../../components/core/Header';
import { MoneyText } from '../../../components/core/MoneyText';
import { OptionsDialog } from '../../../components/core/OptionsDialog';
import { useSettings } from '../../../providers/SettingsProvider';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { formatCurrency, fromDbColor } from '../../../utils/format';
import { resolveIcon } from '../../../utils/icons';
import { TransactionListItem } from '../../transactions/api/transactions';
import { useTransactions } from '../../transactions/hooks/transactions';
import { useDeleteLoan, useLoanById, useLoanProgress } from '../api/loans';

// ─── Local transaction row ────────────────────────────────────────────────────
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

// ─── Screen ──────────────────────────────────────────────────────────────────
export const LoanDetailsScreen = React.memo(function LoanDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const loanId = parseInt(id, 10);
  const theme = useTheme();
  const { colors } = theme;
  const { profile } = useSettings();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { data: loan, isLoading: loadingLoan } = useLoanById(loanId);
  const { data: progress, isLoading: loadingProgress } = useLoanProgress(loanId);
  const { data: transactions, isLoading: loadingTransactions } = useTransactions(50, { loanId });
  const { mutate: deleteLoan } = useDeleteLoan();

  const [showOptions, setShowOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const menuOptions = useMemo(() => [
    {
      key: 'add-tx',
      label: 'Add repayment',
      icon: 'add-circle-outline' as const,
      onPress: () => { setShowOptions(false); router.push(`/transactions/create?loanId=${loanId}`); },
    },
    {
      key: 'edit',
      label: 'Edit loan',
      icon: 'create-outline' as const,
      onPress: () => { setShowOptions(false); router.push(`/loans/edit/${loanId}`); },
    },
    {
      key: 'delete',
      label: 'Delete loan',
      icon: 'trash-outline' as const,
      destructive: true,
      onPress: () => { setShowOptions(false); setShowDeleteConfirm(true); },
    },
  ], [loanId, router]);

  const handleTxPress = useCallback((txId: number) => {
    router.push(`/transactions/edit/${txId}`);
  }, [router]);

  const renderItem = useCallback(({ item }: { item: TransactionListItem }) => (
    <TxRow tx={item} onPress={() => handleTxPress(item.id)} />
  ), [handleTxPress]);

  const keyExtractor = useCallback((item: TransactionListItem) => item.id.toString(), []);

  if (loadingLoan || loadingProgress) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!loan || !progress) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Loan" showBack />
        <EmptyState title="Loan not found" icon="alert-circle-outline" />
      </SafeAreaView>
    );
  }

  const isBorrow = loan.type === 'BORROW';
  const statusColor = isBorrow ? colors.danger : colors.success;
  const currency = loan.account?.currency || profile.defaultCurrency;

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroLabel}>Remaining balance</Text>
            <MoneyText
              amount={progress.remaining}
              currency={currency}
              style={styles.heroAmount}
              weight="sansBold"
            />
          </View>
          <View style={[styles.loanTypeBadge, { backgroundColor: statusColor + '18' }]}>
            <Text style={[styles.loanTypeText, { color: statusColor }]}>
              {isBorrow ? 'Borrowed' : 'Lent'}
            </Text>
          </View>
        </View>

        <View style={styles.progressInfoRow}>
          <Text style={styles.progressLabel}>
            {Math.round(progress.percentage)}% paid of {formatCurrency(progress.total, currency)}
          </Text>
          <Text style={[styles.progressPct, { color: statusColor }]}>
            {formatCurrency(progress.paid, currency)} paid
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.min(progress.percentage, 100)}%`, backgroundColor: statusColor }]} />
        </View>

        <View style={styles.sep} />

        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Start date</Text>
            <Text style={styles.metaValue}>
              {loan.startDate ? new Date(loan.startDate).toLocaleDateString() : '–'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>End date</Text>
            <Text style={styles.metaValue}>
              {loan.endDate ? new Date(loan.endDate).toLocaleDateString() : '–'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Account</Text>
            <Text style={styles.metaValue} numberOfLines={1}>
              {loan.account?.name || '–'}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Repayment history</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={loan.name}
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
        ListEmptyComponent={
          !loadingTransactions ? (
            <EmptyState title="No repayments yet" icon="receipt-outline" />
          ) : null
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      <OptionsDialog
        visible={showOptions}
        onClose={() => setShowOptions(false)}
        title="Loan options"
        subtitle={loan.name}
        options={menuOptions}
      />
      <ConfirmDialog
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete loan"
        message="Delete this loan? Repayment history will remain but won't be linked to this loan."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          deleteLoan(loanId);
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
    gap: theme.spacing[20],
    marginBottom: theme.spacing[8],
  },
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['3xl'],
    padding: theme.spacing[20],
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[20],
  },
  heroLabel: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  heroAmount: {
    fontSize: 32,
    letterSpacing: -1,
  },
  loanTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  loanTypeText: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 12,
  },
  progressInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[8],
  },
  progressLabel: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  progressPct: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 12,
  },
  progressBar: {
    height: 4,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.overlay,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radius.full,
  },
  sep: {
    height: 1,
    backgroundColor: theme.colors.overlay,
    marginVertical: theme.spacing[20],
  },
  metaGrid: {
    flexDirection: 'row',
    gap: theme.spacing[16],
  },
  metaItem: {
    flex: 1,
    gap: 4,
  },
  metaLabel: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  metaValue: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 13,
    color: theme.colors.text,
  },
  sectionLabel: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 12,
    color: theme.colors.textMuted,
    paddingLeft: 4,
  },
});
