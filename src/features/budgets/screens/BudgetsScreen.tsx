import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Header } from '../../../components/ui/Header';
import { OptionsDialog } from '../../../components/ui/OptionsDialog';
import { Typography, Card, MoneyText } from '../../../components/ui';
import { budgets } from '../../../db/schema';
import { useSettings } from '../../../providers/SettingsProvider';
import { useTheme } from '../../../providers/ThemeProvider';
import { ThemeColors } from '../../../theme/colors';
import { radius, spacing, LAYOUT } from '../../../theme/tokens';
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
      <Card
        size="lg"
        variant="outlined"
        shadow="none"
        style={styles.card}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onLongPress={() => {
            setSelectedItem(item);
            setShowManageDialog(true);
          }}
          onPress={() => router.push(`/budgets/details/${item.id}`)}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardInfo}>
              <Typography variant="h3" style={styles.cardName}>{item.name}</Typography>
              <View style={styles.badgeRow}>
                <Typography variant="label">{item.period} • {item.mode}</Typography>
                {item.isRolling && (
                  <View style={styles.rollingBadge}>
                    <Ionicons name="repeat" size={10} color={colors.primary} />
                    <Typography variant="label" style={styles.rollingBadgeText}>Rolling</Typography>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.cardRight}>
              <MoneyText 
                amount={remaining} 
                currency={profile.defaultCurrency} 
                weight="bold" 
                style={styles.cardAmount} 
              />
              <Typography variant="bodySm" color={colors.textMuted}>left</Typography>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressRow}>
              <Typography variant="bodySm" color={colors.textMuted}>
                Spent {formatCurrency(spent, profile.defaultCurrency)}
              </Typography>
              <Typography variant="bodySm" color={colors.textMuted}>
                {formatCurrency(total, profile.defaultCurrency)}
              </Typography>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: statusColor }]} />
            </View>
            {adjustment !== 0 && (
              <Typography 
                variant="monoSm" 
                style={[styles.adjustmentText, { color: adjustment > 0 ? colors.success : colors.danger }]}
              >
                {adjustment > 0 ? '+' : ''}{formatCurrency(adjustment, profile.defaultCurrency)} carried forward
              </Typography>
            )}
          </View>
        </TouchableOpacity>
      </Card>
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
              <Typography variant="h3" style={styles.emptyTitle}>No budgets found</Typography>
              <Typography variant="body" style={styles.emptyText}>
                Set spending limits to stay on track.
              </Typography>
              <TouchableOpacity style={styles.emptyBtn} onPress={handleCreate}>
                <Typography variant="body" weight="semibold">Create budget</Typography>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={handleCreate}>
        <Ionicons name="add" size={28} color={colors.background} />
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
    paddingHorizontal: LAYOUT.screenPadding,
    paddingTop: spacing('4'),
    paddingBottom: 100,
    gap: spacing('4'),
  },
  card: {
    padding: spacing('5'),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing('5'),
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    marginBottom: spacing('0.5'),
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  cardAmount: {
    fontSize: 20,
  },
  progressSection: {},
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing('2'),
  },
  progressBar: {
    height: 6,
    borderRadius: radius('full'),
    backgroundColor: colors.border + '40',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius('full'),
  },
  fab: {
    position: 'absolute',
    bottom: spacing('7'),
    right: spacing('7'),
    width: 64,
    height: 64,
    borderRadius: radius('full'),
    backgroundColor: colors.text,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyContainer: {
    paddingVertical: spacing('12'),
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: spacing('4'),
  },
  emptyText: {
    color: colors.textMuted,
    marginTop: spacing('2'),
    marginBottom: spacing('6'),
    textAlign: 'center',
  },
  emptyBtn: {
    height: 44,
    borderRadius: radius('full'),
    paddingHorizontal: spacing('5'),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('2'),
  },
  rollingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('1'),
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing('1.5'),
    paddingVertical: spacing('0.5'),
    borderRadius: radius('xs'),
  },
  rollingBadgeText: {
    fontSize: 9,
    color: colors.primary,
  },
  adjustmentText: {
    marginTop: spacing('2'),
    textAlign: 'right',
  },
});
