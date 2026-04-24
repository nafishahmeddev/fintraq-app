import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Header } from '../../../components/ui/Header';
import { OptionsDialog } from '../../../components/ui/OptionsDialog';
import { budgets } from '../../../db/schema';
import { useSettings } from '../../../providers/SettingsProvider';
import { useTheme } from '../../../providers/ThemeProvider';
import { ThemeColors } from '../../../theme/colors';
import { RADIUS } from '../../../theme/tokens';
import { TYPOGRAPHY } from '../../../theme/typography';
import { formatCurrency } from '../../../utils/format';
import { useBudgets, useBudgetsProgress, useDeleteBudget } from '../api/budgets';

export const BudgetsScreen = () => {
  const { colors } = useTheme();
  const { profile } = useSettings();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  const { data: budgetsData, isLoading: loadingBudgets } = useBudgets();
  const { data: progressData, isLoading: loadingProgress } = useBudgetsProgress();
  const { mutate: deleteBudget } = useDeleteBudget();

  const [selectedItem, setSelectedItem] = useState<typeof budgets.$inferSelect | null>(null);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleCreate = () => {
    router.push('/budgets/create');
  };

  const manageOptions = React.useMemo(() => {
    if (!selectedItem) return [];

    return [
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

  const renderItem = ({ item }: { item: typeof budgets.$inferSelect }) => {
    const progress = progressData?.find((p) => p.budgetId === item.id);
    const spent = progress?.spent || 0;
    const total = progress?.total || item.amount;
    const remaining = progress?.remaining || Math.max(0, total - spent);
    const percentage = Math.min(progress?.percentage || 0, 100);
    const adjustment = progress?.adjustment || 0;

    // Determine status color
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
        onPress={() => router.push(`/budgets/edit/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{item.name}</Text>
            <View style={styles.badgeRow}>
              <Text style={styles.cardMeta}>{item.period} • {item.mode}</Text>
              {item.isRolling && (
                <View style={styles.rollingBadge}>
                  <Ionicons name="repeat" size={10} color={colors.primary} />
                  <Text style={styles.rollingBadgeText}>Rolling</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.cardRight}>
            <Text style={styles.cardAmount}>
              {formatCurrency(remaining, profile.defaultCurrency)}
            </Text>
            <Text style={styles.cardSubtitle}>left</Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>
              Spent {formatCurrency(spent, profile.defaultCurrency)}
            </Text>
            <Text style={styles.progressLabel}>
              {formatCurrency(total, profile.defaultCurrency)}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: statusColor }]} />
          </View>
          {adjustment !== 0 && (
            <Text style={[styles.adjustmentText, { color: adjustment > 0 ? colors.success : colors.danger }]}>
              {adjustment > 0 ? '+' : ''}{formatCurrency(adjustment, profile.defaultCurrency)} carried forward
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>

      <Header title="Budgets" subtitle="Track spending limits" showBack />

      {(loadingBudgets || loadingProgress) ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={budgetsData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="pie-chart-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No budgets found</Text>
              <Text style={styles.emptyText}>
                Set spending limits to stay on track.
              </Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={handleCreate}>
                <Text style={styles.emptyBtnText}>Create budget</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={handleCreate}>
        <Ionicons name="add" size={28} color="#000" />
      </TouchableOpacity>

      <OptionsDialog
        visible={showManageDialog}
        onClose={() => setShowManageDialog(false)}
        title="Manage Budget"
        subtitle={selectedItem?.name}
        options={manageOptions}
      />

      <ConfirmDialog
        visible={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Delete Budget"
        message="Are you sure you want to delete this budget? Existing transactions will not be deleted."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (selectedItem) {
            deleteBudget(selectedItem.id);
            setSelectedItem(null);
          }
        }}
      />
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 100,
    gap: 12,
  },
  card: {
    borderRadius: RADIUS['2xl'],
    backgroundColor: colors.surface,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontFamily: TYPOGRAPHY.fonts.heading,
    fontSize: 22,
    color: colors.text,
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  cardMeta: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  cardAmount: {
    fontFamily: TYPOGRAPHY.fonts.monoBold,
    fontSize: 20,
    letterSpacing: -0.5,
    color: colors.text,
  },
  cardSubtitle: {
    fontFamily: TYPOGRAPHY.fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  progressSection: {},
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontFamily: TYPOGRAPHY.fonts.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textMuted + '20',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: RADIUS.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    color: colors.text,
    fontSize: 20,
    marginTop: 16,
    letterSpacing: -0.4,
  },
  emptyText: {
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 6,
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyBtn: {
    height: 44,
    borderRadius: RADIUS.full,
    paddingHorizontal: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBtnText: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 14,
    color: colors.text,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rollingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  rollingBadgeText: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 9,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  adjustmentText: {
    fontFamily: TYPOGRAPHY.fonts.medium,
    fontSize: 10,
    marginTop: 8,
    textAlign: 'right',
  },
});
