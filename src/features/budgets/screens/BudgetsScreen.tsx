import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Header } from '../../../components/ui/Header';
import { MoneyText } from '../../../components/ui/MoneyText';
import { OptionsDialog } from '../../../components/ui/OptionsDialog';
import { budgets } from '../../../db/schema';
import { useSettings } from '../../../providers/SettingsProvider';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { formatCurrency } from '../../../utils/format';
import { useBudgets, useBudgetsProgress, useDeleteBudget } from '../api/budgets';

export const BudgetsScreen = React.memo(function BudgetsScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const { profile } = useSettings();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();

  const { data: budgetsData, isLoading: loadingBudgets } = useBudgets();
  const { data: progressData, isLoading: loadingProgress } = useBudgetsProgress();
  const { mutate: deleteBudget } = useDeleteBudget();

  const [selectedItem, setSelectedItem] = useState<typeof budgets.$inferSelect | null>(null);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleCreate = useCallback(() => {
    router.push('/budgets/create');
  }, [router]);

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

  const renderItem = useCallback(({ item }: { item: typeof budgets.$inferSelect }) => {
    const progress = progressData?.find((p) => p.budgetId === item.id);
    const spent = progress?.spent || 0;
    const total = progress?.total || item.amount;
    const remaining = progress?.remaining || Math.max(0, total - spent);
    const percentage = Math.min(progress?.percentage || 0, 100);
    const adjustment = progress?.adjustment || 0;

    const isExceeded = percentage >= 100;
    const isWarning = percentage >= 80 && !isExceeded;
    const statusColor = isExceeded ? colors.danger : isWarning ? colors.warning : colors.primary;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onLongPress={() => {
          setSelectedItem(item);
          setShowManageDialog(true);
        }}
        onPress={() => router.push(`/budgets/details/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.badgeRow}>
              <Text style={styles.cardMeta}>{item.period.toLowerCase()} · {item.mode.toLowerCase()}</Text>
              {item.isRolling && (
                <View style={styles.rollingBadge}>
                  <Ionicons name="repeat" size={10} color={colors.primary} />
                  <Text style={styles.rollingBadgeText}>Rolling</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.cardRight}>
            <MoneyText
              amount={remaining}
              currency={profile.defaultCurrency}
              weight="sansBold"
              style={styles.cardAmount}
            />
            <Text style={styles.cardSubLabel}>left</Text>
          </View>
        </View>

        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Spent {formatCurrency(spent, profile.defaultCurrency)}</Text>
          <Text style={styles.progressLabel}>{formatCurrency(total, profile.defaultCurrency)}</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: statusColor }]} />
        </View>
        {adjustment !== 0 && (
          <Text style={[styles.adjustmentText, { color: adjustment > 0 ? colors.success : colors.danger }]}>
            {adjustment > 0 ? '+' : ''}{formatCurrency(adjustment, profile.defaultCurrency)} carried forward
          </Text>
        )}
      </TouchableOpacity>
    );
  }, [colors, profile.defaultCurrency, styles, progressData, router]);

  const keyExtractor = useCallback((item: typeof budgets.$inferSelect) => item.id.toString(), []);

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
          data={budgetsData}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="pie-chart-outline" size={32} color={colors.textMuted} />
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
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['3xl'],
    padding: theme.spacing[20],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[16],
  },
  cardInfo: {
    flex: 1,
    gap: theme.spacing[4],
  },
  cardName: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: theme.fontSizes.md,
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  cardMeta: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[8],
  },
  rollingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primarySubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
  },
  rollingBadgeText: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 9,
    color: theme.colors.primary,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  cardAmount: {
    fontSize: 22,
    letterSpacing: -0.5,
  },
  cardSubLabel: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[8],
  },
  progressLabel: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 12,
    color: theme.colors.textMuted,
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
  adjustmentText: {
    fontFamily: theme.fontFamilies.sansMedium,
    fontSize: 11,
    marginTop: theme.spacing[8],
    textAlign: 'right',
  },
  emptyContainer: {
    paddingVertical: 64,
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
