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
import { useTransactions } from '../../transactions/hooks/transactions';
import { useGoalById, useGoalProgress } from '../api/goals';

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
export const GoalDetailsScreen = React.memo(function GoalDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const goalId = parseInt(id, 10);
  const theme = useTheme();
  const { colors } = theme;
  const { profile } = useSettings();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { data: goal, isLoading: loadingGoal } = useGoalById(goalId);
  const { data: progress, isLoading: loadingProgress } = useGoalProgress(goalId);
  const { data: transactions, isLoading: loadingTransactions } = useTransactions(50, { goalId });

  const handleTxPress = useCallback((txId: number) => {
    router.push(`/transactions/edit/${txId}`);
  }, [router]);

  const renderItem = useCallback(({ item }: { item: TransactionListItem }) => (
    <TxRow tx={item} onPress={() => handleTxPress(item.id)} />
  ), [handleTxPress]);

  const keyExtractor = useCallback((item: TransactionListItem) => item.id.toString(), []);

  if (loadingGoal || loadingProgress) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!goal || !progress) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Goal" showBack />
        <EmptyState title="Goal not found" icon="alert-circle-outline" />
      </SafeAreaView>
    );
  }

  const isReached = progress.percentage >= 100;
  const statusColor = isReached ? colors.success : colors.primary;
  const pct = Math.min(progress.percentage, 100);

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroLabel}>Saved so far</Text>
            <MoneyText
              amount={progress.current}
              currency={profile.defaultCurrency}
              style={styles.heroAmount}
              weight="sansBold"
            />
          </View>
          <TouchableOpacity
            onPress={() => router.push(`/goals/edit/${goalId}`)}
            activeOpacity={0.75}
          >
            <Ionicons name="create-outline" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.progressInfoRow}>
          <Text style={styles.progressLabel}>
            {Math.round(progress.percentage)}% of {formatCurrency(progress.target, profile.defaultCurrency)}
          </Text>
          <Text style={[styles.progressPct, { color: statusColor }]}>
            {formatCurrency(progress.remaining, profile.defaultCurrency)} left
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: statusColor }]} />
        </View>

        <View style={styles.sep} />

        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Status</Text>
            <Text style={styles.metaValue}>{goal.status.toLowerCase()}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>End date</Text>
            <Text style={styles.metaValue}>
              {goal.endDate ? new Date(goal.endDate).toLocaleDateString() : 'No date'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Progress</Text>
            <Text style={[styles.metaValue, { color: statusColor }]}>
              {isReached ? 'Reached!' : 'Tracking'}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Contributions</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={goal.name}
        showBack
        rightAction={
          <TouchableOpacity
            onPress={() => router.push(`/transactions/create?goalId=${goalId}`)}
            activeOpacity={0.75}
          >
            <Ionicons name="add" size={26} color={colors.text} />
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
            <EmptyState title="No contributions yet" icon="receipt-outline" />
          ) : null
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
    fontSize: 14,
    color: theme.colors.text,
    textTransform: 'capitalize',
  },
  sectionLabel: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 12,
    color: theme.colors.textMuted,
    paddingLeft: 4,
  },
});
