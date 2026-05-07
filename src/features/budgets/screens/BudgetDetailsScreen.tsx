import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Header } from '../../../components/ui/Header';
import { MoneyText } from '../../../components/ui/MoneyText';
import { useSettings } from '../../../providers/SettingsProvider';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { formatCurrency, fromDbColor } from '../../../utils/format';
import { resolveIcon } from '../../../utils/icons';
import { TransactionListItem } from '../../transactions/api/transactions';
import { useBudgetById, useBudgetsProgress, useTransactionsForBudget } from '../api/budgets';

// ─── Transaction row ──────────────────────────────────────────────────────────
const TxRow = React.memo(function TxRow({
  tx,
  onPress,
}: {
  tx: TransactionListItem;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createTxStyles(theme), [theme]);

  const isTransfer = tx.type === 'TRANSFER';
  const catColor = isTransfer
    ? colors.primary
    : tx.category ? fromDbColor(tx.category.color) : colors.textMuted;
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
        <Text style={styles.meta}>{label} · {tx.account.name}</Text>
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
export const BudgetDetailsScreen = React.memo(function BudgetDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const budgetId = parseInt(id, 10);
  const theme = useTheme();
  const { colors } = theme;
  const { profile } = useSettings();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { data: budget, isLoading: loadingBudget } = useBudgetById(budgetId);
  const { data: progressData, isLoading: loadingProgress } = useBudgetsProgress();
  const { data: transactions, isLoading: loadingTx } = useTransactionsForBudget(budget);

  const progress = useMemo(
    () => progressData?.find(p => p.budgetId === budgetId),
    [progressData, budgetId]
  );

  const handleTxPress = useCallback((txId: number) => {
    router.push(`/transactions/edit/${txId}`);
  }, [router]);

  const renderItem = useCallback(({ item }: { item: TransactionListItem }) => (
    <TxRow tx={item} onPress={() => handleTxPress(item.id)} />
  ), [handleTxPress]);

  const keyExtractor = useCallback((item: TransactionListItem) => item.id.toString(), []);

  if (loadingBudget || loadingProgress) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!budget) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Budget" showBack />
        <EmptyState title="Budget not found" icon="alert-circle-outline" />
      </SafeAreaView>
    );
  }

  const spent = progress?.spent ?? 0;
  const total = progress?.total ?? budget.amount;
  const remaining = progress?.remaining ?? Math.max(0, total - spent);
  const rawPct = progress?.percentage ?? 0;
  const pct = Math.min(rawPct, 100);
  const adjustment = progress?.adjustment ?? 0;

  const isExceeded = rawPct >= 100;
  const isWarning = rawPct >= 80 && !isExceeded;
  const statusColor = isExceeded ? colors.danger : isWarning ? colors.warning : colors.success;
  const statusLabel = isExceeded ? 'Exceeded' : isWarning ? 'Caution' : 'On track';

  const cap = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

  const renderHeader = () => (
    <View style={styles.headerContent}>

      {/* ── Hero card ── */}
      <View style={styles.heroCard}>

        {/* Status accent strip */}
        <View style={[styles.accentStrip, { backgroundColor: statusColor }]} />

        <View style={styles.heroBody}>

          {/* Kicker row */}
          <View style={styles.kickerRow}>
            <Text style={styles.kicker}>
              {cap(budget.period)} · {budget.type === 'DR' ? 'Expense' : 'Income'}
            </Text>
            <View style={[styles.statusPill, { backgroundColor: statusColor + '18' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusPillText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>

          {/* Large percentage display */}
          <View style={styles.pctBlock}>
            <Text style={[styles.pctDisplay, { color: statusColor }]}>
              {Math.round(rawPct)}%
            </Text>
            <Text style={styles.pctSub}>of budget used</Text>
          </View>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: statusColor }]} />
          </View>

          {/* Spent · remaining row */}
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabelText}>
              {formatCurrency(spent, profile.defaultCurrency)} spent
            </Text>
            <Text style={styles.progressLabelText}>
              {formatCurrency(total, profile.defaultCurrency)} limit
            </Text>
          </View>

          {/* Sep */}
          <View style={styles.sep} />

          {/* Stats grid */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Spent</Text>
              <MoneyText
                amount={spent}
                currency={profile.defaultCurrency}
                weight="sansBold"
                style={styles.statAmount}
              />
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Budget</Text>
              <MoneyText
                amount={total}
                currency={profile.defaultCurrency}
                weight="sansBold"
                style={styles.statAmount}
              />
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Remaining</Text>
              <MoneyText
                amount={remaining}
                currency={profile.defaultCurrency}
                weight="sansBold"
                style={[styles.statAmount, { color: isExceeded ? colors.danger : colors.text }]}
              />
            </View>
          </View>

          {/* Sep */}
          <View style={styles.sep} />

          {/* Meta grid */}
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Period</Text>
              <Text style={styles.metaValue}>{cap(budget.period)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Mode</Text>
              <Text style={styles.metaValue}>{cap(budget.mode)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Rolling</Text>
              <Text style={styles.metaValue}>{budget.isRolling ? 'Yes' : 'No'}</Text>
            </View>
          </View>

          {/* Adjustment (if rolling carry-forward) */}
          {adjustment !== 0 && (
            <View style={[styles.adjustRow, { backgroundColor: (adjustment > 0 ? colors.success : colors.danger) + '12' }]}>
              <Ionicons
                name={adjustment > 0 ? 'arrow-forward-circle-outline' : 'arrow-back-circle-outline'}
                size={14}
                color={adjustment > 0 ? colors.success : colors.danger}
              />
              <Text style={[styles.adjustText, { color: adjustment > 0 ? colors.success : colors.danger }]}>
                {adjustment > 0 ? '+' : ''}{formatCurrency(adjustment, profile.defaultCurrency)} carried forward from last period
              </Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.sectionLabel}>Transactions</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={budget.name}
        showBack
        rightAction={
          <TouchableOpacity
            onPress={() => router.push(`/budgets/edit/${budgetId}`)}
            activeOpacity={0.75}
          >
            <Ionicons name="create-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        }
      />
      <FlatList
        data={transactions}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          !loadingTx ? (
            <EmptyState title="No transactions" icon="receipt-outline" />
          ) : null
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
});

// ─── Styles ──────────────────────────────────────────────────────────────────
const createTxStyles = (theme: Theme) => StyleSheet.create({
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

  // Hero card
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['3xl'],
    overflow: 'hidden',
  },
  accentStrip: {
    height: 4,
    width: '100%',
  },
  heroBody: {
    padding: theme.spacing[20],
    gap: theme.spacing[16],
  },

  // Kicker
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kicker: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 12,
    color: theme.colors.textMuted,
    letterSpacing: 0.2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: theme.radius.full,
  },
  statusPillText: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 10,
  },

  // Percentage display
  pctBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing[8],
  },
  pctDisplay: {
    fontFamily: theme.fontFamilies.heading,
    fontSize: 52,
    lineHeight: 56,
    letterSpacing: -2,
  },
  pctSub: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 13,
    color: theme.colors.textMuted,
  },

  // Progress
  progressTrack: {
    height: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.overlay,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radius.full,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -theme.spacing[8],
  },
  progressLabelText: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 12,
    color: theme.colors.textMuted,
  },

  // Sep
  sep: {
    height: 1,
    backgroundColor: theme.colors.overlay,
  },

  // Stats grid
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing[16],
  },
  statItem: {
    flex: 1,
    gap: theme.spacing[4],
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.overlay,
  },
  statLabel: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  statAmount: {
    fontSize: 15,
    letterSpacing: -0.3,
  },

  // Meta grid
  metaGrid: {
    flexDirection: 'row',
    gap: theme.spacing[16],
  },
  metaItem: {
    flex: 1,
    gap: theme.spacing[4],
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

  // Adjustment
  adjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[8],
    padding: theme.spacing[12],
    borderRadius: theme.radius.lg,
  },
  adjustText: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 12,
    flex: 1,
  },

  sectionLabel: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 12,
    color: theme.colors.textMuted,
    paddingLeft: 4,
  },
});
