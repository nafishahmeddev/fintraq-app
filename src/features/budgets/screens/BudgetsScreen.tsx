import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfirmDialog } from '../../../components/core/ConfirmDialog';
import { Header } from '../../../components/core/Header';
import { MoneyText } from '../../../components/core/MoneyText';
import { OptionsDialog } from '../../../components/core/OptionsDialog';
import { budgets } from '../../../db/schema';
import { useSettings } from '../../../providers/SettingsProvider';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { formatCurrency } from '../../../utils/format';
import { useBudgets, useBudgetsProgress, useDeleteBudget } from '../api/budgets';
import { BudgetProgress } from '../services/budgetQueries';

type BudgetRow = typeof budgets.$inferSelect & { progress?: BudgetProgress };

function statusOf(pct: number): { label: string; color: (c: ReturnType<typeof useTheme>['colors']) => string } {
  if (pct >= 100) return { label: 'Exceeded', color: (c) => c.danger };
  if (pct >= 80) return { label: 'Caution', color: (c) => c.warning };
  return { label: 'On track', color: (c) => c.success };
}

// ─── Card ────────────────────────────────────────────────────────────────────
const BudgetCard = React.memo(function BudgetCard({
  item,
  onPress,
  onLongPress,
}: {
  item: BudgetRow;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const theme = useTheme();
  const { colors } = theme;
  const { profile } = useSettings();
  const styles = useMemo(() => createCardStyles(theme), [theme]);

  const p = item.progress;
  const spent = p?.spent ?? 0;
  const total = p?.total ?? item.amount;
  const remaining = p?.remaining ?? Math.max(0, total - spent);
  const pct = Math.min(p?.percentage ?? 0, 100);
  const rawPct = p?.percentage ?? 0;
  const adjustment = p?.adjustment ?? 0;

  const status = statusOf(rawPct);
  const statusColor = status.color(colors);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={280}
      activeOpacity={0.82}
    >
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: statusColor }]} />

      <View style={styles.inner}>
        {/* Row 1: name + status */}
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <View style={[styles.statusPill, { backgroundColor: statusColor + '18' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusLabel, { color: statusColor }]}>{status.label}</Text>
          </View>
        </View>

        {/* Row 2: meta */}
        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            {item.period.charAt(0) + item.period.slice(1).toLowerCase()} · {item.mode.charAt(0) + item.mode.slice(1).toLowerCase()}
          </Text>
          {item.isRolling && (
            <View style={styles.rollingChip}>
              <Ionicons name="repeat" size={10} color={colors.primary} />
              <Text style={styles.rollingChipText}>Rolling</Text>
            </View>
          )}
        </View>

        {/* Remaining amount */}
        <View style={styles.amountBlock}>
          <MoneyText
            amount={remaining}
            currency={profile.defaultCurrency}
            weight="sansBold"
            style={styles.remainingAmount}
          />
          <Text style={styles.remainingLabel}>remaining</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: statusColor }]} />
        </View>

        {/* Spent + pct row */}
        <View style={styles.progressMeta}>
          <Text style={styles.spentText}>
            {formatCurrency(spent, profile.defaultCurrency)} spent
          </Text>
          <Text style={[styles.pctText, { color: statusColor }]}>
            {Math.round(rawPct)}% of {formatCurrency(total, profile.defaultCurrency)}
          </Text>
        </View>

        {adjustment !== 0 && (
          <Text style={[styles.adjustText, { color: adjustment > 0 ? colors.success : colors.danger }]}>
            {adjustment > 0 ? '+' : ''}{formatCurrency(adjustment, profile.defaultCurrency)} carried forward
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
});

// ─── Screen ──────────────────────────────────────────────────────────────────
export const BudgetsScreen = React.memo(function BudgetsScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();

  const { data: budgetsData, isLoading: loadingBudgets } = useBudgets();
  const { data: progressData, isLoading: loadingProgress } = useBudgetsProgress();
  const { mutate: deleteBudget } = useDeleteBudget();

  const [selectedItem, setSelectedItem] = useState<typeof budgets.$inferSelect | null>(null);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const mergedData = useMemo<BudgetRow[]>(() => {
    if (!budgetsData) return [];
    return budgetsData.map((b) => ({
      ...b,
      progress: progressData?.find((p) => p.budgetId === b.id),
    }));
  }, [budgetsData, progressData]);

  const handleCreate = useCallback(() => router.push('/budgets/create'), [router]);

  const manageOptions = useMemo(() => {
    if (!selectedItem) return [];
    return [
      {
        key: 'view-details',
        label: 'View details',
        icon: 'information-circle-outline' as const,
        onPress: () => router.push(`/budgets/details/${selectedItem.id}`),
      },
      {
        key: 'edit-budget',
        label: 'Edit details',
        icon: 'create-outline' as const,
        onPress: () => router.push(`/budgets/edit/${selectedItem.id}`),
      },
      {
        key: 'delete-budget',
        label: 'Delete budget',
        icon: 'trash-outline' as const,
        destructive: true,
        onPress: () => setShowDeleteDialog(true),
      },
    ];
  }, [selectedItem, router]);

  const renderItem = useCallback(({ item }: { item: BudgetRow }) => (
    <BudgetCard
      item={item}
      onPress={() => router.push(`/budgets/details/${item.id}`)}
      onLongPress={() => {
        setSelectedItem(item);
        setShowManageDialog(true);
      }}
    />
  ), [router]);

  const keyExtractor = useCallback((item: BudgetRow) => item.id.toString(), []);

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Budgets"
        showBack
        rightAction={
          <TouchableOpacity onPress={handleCreate} activeOpacity={0.75}>
            <Ionicons name="add" size={26} color={colors.text} />
          </TouchableOpacity>
        }
      />

      {(loadingBudgets || loadingProgress) ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={mergedData}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="pie-chart-outline" size={36} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No budgets yet</Text>
              <Text style={styles.emptyText}>Set spending limits to stay on track.</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={handleCreate} activeOpacity={0.8}>
                <Text style={styles.emptyBtnText}>Create budget</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <OptionsDialog
        visible={showManageDialog}
        onClose={() => setShowManageDialog(false)}
        title="Manage budget"
        subtitle={selectedItem?.name}
        options={manageOptions}
      />

      <ConfirmDialog
        visible={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Delete budget"
        message="Are you sure you want to delete this budget? Existing transactions will not be deleted."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (selectedItem) {
            deleteBudget(selectedItem.id);
            setSelectedItem(null);
          }
          setShowDeleteDialog(false);
        }}
      />
    </SafeAreaView>
  );
});

// ─── Styles ──────────────────────────────────────────────────────────────────
const createCardStyles = (theme: Theme) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['3xl'],
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
  },
  inner: {
    flex: 1,
    padding: theme.spacing[20],
    gap: theme.spacing[8],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  name: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: theme.fontSizes.md,
    color: theme.colors.text,
    letterSpacing: -0.3,
    flex: 1,
    marginRight: theme.spacing[8],
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
  statusLabel: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[8],
    marginBottom: theme.spacing[4],
  },
  meta: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  rollingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primarySubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
  },
  rollingChipText: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 9,
    color: theme.colors.primary,
  },
  amountBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing[8],
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[4],
  },
  remainingAmount: {
    fontSize: 28,
    letterSpacing: -0.8,
  },
  remainingLabel: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  progressTrack: {
    height: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.overlay,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radius.full,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spentText: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  pctText: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 12,
  },
  adjustText: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 11,
    textAlign: 'right',
  },
});

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
  listContent: {
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: theme.spacing[16],
    paddingBottom: 40,
    gap: theme.spacing[12],
  },
  empty: {
    paddingVertical: 72,
    alignItems: 'center',
    gap: theme.spacing[8],
  },
  emptyTitle: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: theme.fontSizes.lg,
    color: theme.colors.text,
    marginTop: theme.spacing[8],
  },
  emptyText: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    maxWidth: 240,
  },
  emptyBtn: {
    marginTop: theme.spacing[8],
    height: 40,
    paddingHorizontal: theme.spacing[20],
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBtnText: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 13,
    color: theme.colors.text,
  },
});
