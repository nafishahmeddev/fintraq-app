import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Header } from '../../../components/ui/Header';
import { MoneyText } from '../../../components/ui/MoneyText';
import { OptionsDialog } from '../../../components/ui/OptionsDialog';
import { usePremium } from '../../../providers/PremiumProvider';
import { useSettings } from '../../../providers/SettingsProvider';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { useDeleteGoal, useGoals, useGoalsProgress } from '../api/goals';
import { GoalProgress } from '../services/goalQueries';

const GoalCard = React.memo(function GoalCard({
  item,
  onPress,
  onLongPress,
}: {
  item: GoalProgress;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const theme = useTheme();
  const { colors } = theme;
  const { profile } = useSettings();
  const styles = useMemo(() => createCardStyles(theme), [theme]);

  const isReached = item.percentage >= 100;
  const statusColor = isReached ? colors.success : colors.primary;
  const pct = Math.min(item.percentage, 100);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View style={[styles.accentStrip, { backgroundColor: statusColor }]} />
      <View style={styles.cardBody}>
        <View style={styles.topRow}>
          <View style={styles.nameBlock}>
            <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.cardStatus}>{item.status.toLowerCase()}</Text>
          </View>
          <View style={styles.amountBlock}>
            <MoneyText
              amount={item.remaining}
              currency={profile.defaultCurrency}
              weight="sansBold"
              style={styles.cardAmount}
            />
            <Text style={styles.cardSubLabel}>left</Text>
          </View>
        </View>

        <View style={styles.progressInfoRow}>
          <Text style={styles.progressLabel}>
            Saved {item.current.toLocaleString()} of {item.target.toLocaleString()}
          </Text>
          <Text style={[styles.progressPct, { color: statusColor }]}>{Math.round(pct)}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: statusColor }]} />
        </View>

        {isReached && (
          <View style={[styles.reachedPill, { backgroundColor: colors.success + '18' }]}>
            <Ionicons name="checkmark-circle" size={12} color={colors.success} />
            <Text style={[styles.reachedText, { color: colors.success }]}>Goal reached!</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

export const GoalsScreen = React.memo(function GoalsScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const { isPremium, showAlert } = usePremium();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { data: goals, isLoading: loadingGoals } = useGoals();
  const { data: progressData, isLoading: loadingProgress } = useGoalsProgress();
  const { mutate: deleteGoal } = useDeleteGoal();

  const [selectedGoal, setSelectedGoal] = useState<GoalProgress | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleCreate = useCallback(() => {
    if (!isPremium && (goals?.length || 0) >= 2) {
      showAlert({
        title: 'Limit reached',
        message: 'Free users can track up to 2 goals. Upgrade to Pro for unlimited targets!',
        type: 'warning',
        buttons: [
          { text: 'Maybe later', style: 'cancel' },
          { text: 'Upgrade now', onPress: () => router.push('/premium') },
        ],
      });
      return;
    }
    router.push('/goals/create');
  }, [router, isPremium, goals, showAlert]);

  const handleGoalPress = useCallback((goalId: number) => {
    router.push(`/goals/details/${goalId}`);
  }, [router]);

  const options = useMemo(() => [
    {
      key: 'view',
      label: 'View details',
      icon: 'information-circle-outline' as const,
      onPress: () => {
        setShowOptions(false);
        if (selectedGoal) handleGoalPress(selectedGoal.goalId);
      },
    },
    {
      key: 'edit',
      label: 'Edit goal',
      icon: 'create-outline' as const,
      onPress: () => {
        setShowOptions(false);
        if (selectedGoal) router.push(`/goals/edit/${selectedGoal.goalId}`);
      },
    },
    {
      key: 'delete',
      label: 'Delete goal',
      icon: 'trash-outline' as const,
      destructive: true,
      onPress: () => {
        setShowOptions(false);
        setShowDeleteConfirm(true);
      },
    },
  ], [selectedGoal, handleGoalPress, router]);

  const renderItem = useCallback(({ item }: { item: GoalProgress }) => (
    <GoalCard
      item={item}
      onPress={() => handleGoalPress(item.goalId)}
      onLongPress={() => { setSelectedGoal(item); setShowOptions(true); }}
    />
  ), [handleGoalPress]);

  const keyExtractor = useCallback((item: GoalProgress) => item.goalId.toString(), []);

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Goals"
        showBack
        rightAction={
          <TouchableOpacity onPress={handleCreate} activeOpacity={0.75}>
            <Ionicons name="add" size={26} color={colors.text} />
          </TouchableOpacity>
        }
      />

      {loadingGoals || loadingProgress ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={progressData}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="flag-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No goals yet</Text>
              <Text style={styles.emptyText}>Set a savings target and track your progress.</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={handleCreate} activeOpacity={0.8}>
                <Text style={styles.emptyBtnText}>Create first goal</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <OptionsDialog
        visible={showOptions}
        onClose={() => setShowOptions(false)}
        title="Goal options"
        subtitle={selectedGoal?.name}
        options={options}
      />

      <ConfirmDialog
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete goal"
        message={`Delete "${selectedGoal?.name}"? Linked transactions will remain but won't be associated with this goal.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (selectedGoal) deleteGoal(selectedGoal.goalId);
          setShowDeleteConfirm(false);
        }}
      />
    </SafeAreaView>
  );
});

const createCardStyles = (theme: Theme) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['3xl'],
    overflow: 'hidden',
    flexDirection: 'row',
  },
  accentStrip: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: theme.spacing[20],
    gap: theme.spacing[12],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nameBlock: {
    flex: 1,
    gap: theme.spacing[4],
    paddingRight: theme.spacing[12],
  },
  cardName: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: theme.fontSizes.md,
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  cardStatus: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 12,
    color: theme.colors.textMuted,
    textTransform: 'capitalize',
  },
  amountBlock: {
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
  progressInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 12,
    color: theme.colors.textMuted,
    flex: 1,
  },
  progressPct: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.overlay,
    overflow: 'hidden',
    marginTop: -theme.spacing[4],
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radius.full,
  },
  reachedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[4],
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  reachedText: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 11,
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
