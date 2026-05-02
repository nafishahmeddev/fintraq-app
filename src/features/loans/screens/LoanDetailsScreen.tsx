import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, Card, Typography, MoneyText, SectionLabel, TransactionRow, EmptyState, IconButton } from '../../../components/ui';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { useSettings } from '../../../providers/SettingsProvider';
import { useLoanById, useLoanProgress } from '../api/loans';
import { useTransactions } from '../../transactions/hooks/transactions';
import { formatCurrency } from '../../../utils/format';

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

  const handleEdit = useCallback(() => {
    router.push(`/loans/edit/${loanId}`);
  }, [router, loanId]);

  if (loadingLoan || loadingProgress) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!loan || !progress) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Error" showBack />
        <EmptyState
          title="Loan not found"
          subtitle="The loan you're looking for doesn't exist."
          icon="alert-circle-outline"
        />
      </SafeAreaView>
    );
  }

  const statusColor = loan.type === 'BORROW' ? colors.danger : colors.success;

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <Card variant="outlined" size="lg" shadow="none" style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View>
            <Typography variant="label">Remaining balance</Typography>
            <MoneyText 
              amount={progress.remaining} 
              currency={loan.account?.currency || profile.defaultCurrency} 
              style={styles.heroAmount}
            />
          </View>
          <IconButton
            icon="create-outline"
            onPress={handleEdit}
            variant="ghost"
            size="md"
          />
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressInfo}>
            <Typography variant="bodySm" color={colors.textMuted}>
              {Math.round(progress.percentage)}% paid of {formatCurrency(progress.total, loan.account?.currency || profile.defaultCurrency)}
            </Typography>
            <Typography variant="monoSm" weight="sansBold">
              {formatCurrency(progress.paid, loan.account?.currency || profile.defaultCurrency)} paid
            </Typography>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min(progress.percentage, 100)}%`, 
                  backgroundColor: statusColor 
                }
              ]} 
            />
          </View>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Typography variant="label">Type</Typography>
            <Typography variant="bodySm" weight="sansSemiBold" style={{ color: statusColor }}>
              {loan.type}
            </Typography>
          </View>
          <View style={styles.metaItem}>
            <Typography variant="label">Start date</Typography>
            <Typography variant="bodySm" weight="sansSemiBold">
              {loan.startDate ? new Date(loan.startDate).toLocaleDateString() : 'No date'}
            </Typography>
          </View>
          <View style={styles.metaItem}>
            <Typography variant="label">End date</Typography>
            <Typography variant="bodySm" weight="sansSemiBold">
              {loan.endDate ? new Date(loan.endDate).toLocaleDateString() : 'No date'}
            </Typography>
          </View>
        </View>
      </Card>

      <SectionLabel text="Repayment history" style={styles.sectionHeader} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title={loan.name} 
        showBack 
        rightAction={
          <TouchableOpacity 
            onPress={() => router.push(`/transactions/create?loanId=${loanId}`)}
            style={styles.headerBtn}
          >
            <Ionicons name="add" size={24} color={colors.primary} />
          </TouchableOpacity>
        }
      />
      
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <TransactionRow
            tx={item}
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
              title="No repayments yet"
              subtitle="Record payments to this loan to see your repayment history here."
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
  headerContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  heroCard: {
    padding: 24,
    marginBottom: 24,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  heroAmount: {
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -1,
  },
  progressSection: {
    marginBottom: 24,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.border + '40',
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radius.full,
  },
  metaGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    borderStyle: 'dashed',
    paddingTop: 20,
    gap: 16,
  },
  metaItem: {
    flex: 1,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 40,
  },
});
