import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useMemo, useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, Card, Typography, MoneyText, OptionsDialog, ConfirmDialog, EmptyState } from '../../../components/ui';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { useSettings } from '../../../providers/SettingsProvider';
import { usePremium } from '../../../providers/PremiumProvider';
import { useGoals, useGoalsProgress, useDeleteGoal } from '../api/goals';
import { GoalProgress } from '../services/goalQueries';

export const GoalsScreen = React.memo(function GoalsScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const { profile } = useSettings();
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
          { text: 'Upgrade now', onPress: () => router.push('/premium') }
        ]
      });
      return;
    }
    router.push('/goals/create');
  }, [router, isPremium, goals, showAlert]);

  const handleGoalPress = useCallback((goalId: number) => {
    router.push(`/goals/details/${goalId}`);
  }, [router]);

  const handleGoalLongPress = useCallback((goal: GoalProgress) => {
    setSelectedGoal(goal);
    setShowOptions(true);
  }, []);

  const options = useMemo(() => [
    {
      key: 'view',
      label: 'View details',
      icon: 'information-circle-outline' as const,
      onPress: () => {
        setShowOptions(false);
        if (selectedGoal) handleGoalPress(selectedGoal.goalId);
      }
    },
    {
      key: 'edit',
      label: 'Edit goal',
      icon: 'create-outline' as const,
      onPress: () => {
        setShowOptions(false);
        if (selectedGoal) router.push(`/goals/edit/${selectedGoal.goalId}`);
      }
    },
    {
      key: 'delete',
      label: 'Delete goal',
      icon: 'trash-outline' as const,
      destructive: true,
      onPress: () => {
        setShowOptions(false);
        setShowDeleteConfirm(true);
      }
    }
  ], [selectedGoal, handleGoalPress, router]);

  const renderItem = useCallback(({ item }: { item: GoalProgress }) => {
    const isReached = item.percentage >= 100;
    const statusColor = isReached ? colors.success : colors.primary;

    return (
      <Card size="lg" variant="outlined" shadow="none" style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleGoalPress(item.goalId)}
          onLongPress={() => handleGoalLongPress(item)}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardInfo}>
              <Typography variant="h3" numberOfLines={1}>{item.name}</Typography>
              <Typography variant="label" color={colors.textMuted}>{item.status}</Typography>
            </View>
            <View style={styles.cardRight}>
              <MoneyText 
                amount={item.remaining} 
                currency={profile.defaultCurrency} 
                weight="sansBold" 
                style={styles.remainingAmount}
              />
              <Typography variant="label" color={colors.textMuted}>left</Typography>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressInfo}>
              <Typography variant="bodySm" color={colors.textMuted}>
                Saved {profile.defaultCurrency} {item.current.toLocaleString()} of {item.target.toLocaleString()}
              </Typography>
              <Typography variant="monoSm" weight="sansBold">{Math.round(item.percentage)}%</Typography>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.min(item.percentage, 100)}%`, 
                    backgroundColor: statusColor 
                  }
                ]} 
              />
            </View>
          </View>
        </TouchableOpacity>
      </Card>
    );
  }, [colors, profile.defaultCurrency, styles, handleGoalPress, handleGoalLongPress]);

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Goals" 
        
        showBack 
        rightAction={
          <TouchableOpacity onPress={handleCreate} style={styles.headerBtn}>
            <Ionicons name="add" size={24} color={colors.primary} />
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
          keyExtractor={(item) => item.goalId.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              title="No goals yet"
             
              icon="flag-outline"
              actionLabel="Create first goal"
              onAction={handleCreate}
            />
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
        message={`Are you sure you want to delete "${selectedGoal?.name}"? Linked transactions will remain but won't be associated with this goal.`}
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
  headerBtn: {
    padding: 8,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  remainingAmount: {
    fontSize: 20,
  },
  progressSection: {
    gap: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.colors.border + '40',
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radius.full,
  },
});
