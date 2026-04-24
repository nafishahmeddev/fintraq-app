import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, TransactionRow, Typography, Card, MoneyText, EmptyState, SectionLabel, Badge, IconButton } from '../../../components/ui';
import { useTheme } from '../../../providers/ThemeProvider';
import { useSettings } from '../../../providers/SettingsProvider';
import { ThemeColors } from '../../../theme/colors';
import { radius, spacing, LAYOUT } from '../../../theme/tokens';
import { TYPOGRAPHY } from '../../../theme/typography';
import { useBudgetById, useBudgetsProgress } from '../api/budgets';
import { useTransactions } from '../../transactions/hooks/transactions';

export const BudgetDetailsScreen = React.memo(function BudgetDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const budgetId = parseInt(id, 10);
  const { colors } = useTheme();
  const { profile } = useSettings();
  const router = useRouter();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const { data: budget, isLoading: loadingBudget } = useBudgetById(budgetId);
  const { data: progressData, isLoading: loadingProgress } = useBudgetsProgress();
  const { data: transactions, isLoading: loadingTransactions } = useTransactions(50, { budgetId });

  const progress = React.useMemo(() => 
    progressData?.find(p => p.budgetId === budgetId), 
    [progressData, budgetId]
  );

  if (loadingBudget || loadingProgress) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!budget) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Error" showBack />
        <EmptyState
          title="Budget not found"
          subtitle="The budget you're looking for doesn't exist or was deleted."
          icon="alert-circle-outline"
        />
      </SafeAreaView>
    );
  }

  const spent = progress?.spent || 0;
  const total = progress?.total || budget.amount;
  const remaining = progress?.remaining || Math.max(0, total - spent);
  const percentage = Math.min(progress?.percentage || 0, 100);

  const isExceeded = percentage >= 100;
  const isWarning = percentage >= 80 && !isExceeded;
  const statusColor = isExceeded ? colors.danger : isWarning ? colors.warning : colors.primary;

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <Card variant="outlined" size="lg" shadow="none" style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View>
            <Typography variant="label">Remaining</Typography>
            <MoneyText 
              amount={remaining} 
              currency={profile.defaultCurrency} 
              style={styles.heroAmount} 
            />
          </View>
          <IconButton
            icon="create-outline"
            size="md"
            variant="ghost"
            onPress={() => router.push(`/budgets/edit/${budgetId}`)}
          />
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressInfo}>
            <Typography variant="bodySm" color={colors.textMuted}>
              Spent {formatCurrency(spent, profile.defaultCurrency)} of {formatCurrency(total, profile.defaultCurrency)}
            </Typography>
            <Typography variant="monoSm" weight="bold">{Math.round(percentage)}%</Typography>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${percentage}%`, 
                  backgroundColor: statusColor 
                }
              ]} 
            />
          </View>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Typography variant="label">Period</Typography>
            <Typography variant="bodySm" weight="semibold" style={styles.capitalize}>
              {budget.period.toLowerCase()}
            </Typography>
          </View>
          <View style={styles.metaItem}>
            <Typography variant="label">Mode</Typography>
            <Typography variant="bodySm" weight="semibold" style={styles.capitalize}>
              {budget.mode.toLowerCase()}
            </Typography>
          </View>
          <View style={styles.metaItem}>
            <Typography variant="label">Type</Typography>
            <Typography variant="bodySm" weight="semibold">
              {budget.type === 'DR' ? 'Expense' : 'Income'}
            </Typography>
          </View>
        </View>
      </Card>

      <SectionLabel text="TRANSACTIONS" style={styles.sectionHeader} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title={budget.name} showBack />
      
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <TransactionRow
            tx={item}
            colors={colors}
            isFirst={index === 0}
            isLast={index === (transactions?.length || 0) - 1}
            showDate
            onPress={() => router.push(`/transactions/edit/${item.id}`)}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          !loadingTransactions ? (
            <EmptyState
              title="No transactions"
              subtitle="No transactions are linked to this budget yet."
              icon="receipt-outline"
            />
          ) : null
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
});

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  headerContent: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingTop: spacing('4'),
  },
  heroCard: {
    padding: spacing('6'),
    marginBottom: spacing('7'),
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing('6'),
  },
  heroAmount: {
    fontSize: TYPOGRAPHY.sizes.xxxl,
    lineHeight: TYPOGRAPHY.sizes.xxxl * 1.1,
    letterSpacing: -1,
  },
  progressSection: {
    marginBottom: spacing('6'),
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing('2'),
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border + '40',
    borderRadius: radius('full'),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius('full'),
  },
  metaGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderStyle: 'dashed',
    paddingTop: spacing('5'),
    gap: spacing('4'),
  },
  metaItem: {
    flex: 1,
  },
  capitalize: {
    textTransform: 'capitalize',
  },
  sectionHeader: {
    marginBottom: spacing('4'),
  },
  listContent: {
    paddingBottom: spacing('10'),
  },
});
