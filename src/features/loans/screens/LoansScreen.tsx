import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, ConfirmDialog, EmptyState, Header, MoneyText, OptionsDialog, Typography } from '../../../components/ui';
import { usePremium } from '../../../providers/PremiumProvider';
import { useSettings } from '../../../providers/SettingsProvider';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { useDeleteLoan, useLoans, useLoansProgress } from '../api/loans';
import { LoanProgress } from '../services/loanQueries';

export const LoansScreen = React.memo(function LoansScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const { profile } = useSettings();
  const { isPremium, showAlert } = usePremium();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { data: loans, isLoading: loadingLoans } = useLoans();
  const { data: progressData, isLoading: loadingProgress } = useLoansProgress();
  const { mutate: deleteLoan } = useDeleteLoan();

  const [selectedLoan, setSelectedLoan] = useState<LoanProgress | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleCreate = useCallback(() => {
    if (!isPremium && (loans?.length || 0) >= 2) {
      showAlert({
        title: 'Limit reached',
        message: 'Free users can track up to 2 active loans. Upgrade to Pro for unlimited tracking!',
        type: 'warning',
        buttons: [
          { text: 'Maybe later', style: 'cancel' },
          { text: 'Upgrade now', onPress: () => router.push('/premium') }
        ]
      });
      return;
    }
    router.push('/loans/create');
  }, [router, isPremium, loans, showAlert]);

  const handleLoanPress = useCallback((loanId: number) => {
    router.push(`/loans/details/${loanId}`);
  }, [router]);

  const handleLoanLongPress = useCallback((loan: LoanProgress) => {
    setSelectedLoan(loan);
    setShowOptions(true);
  }, []);

  const options = useMemo(() => [
    {
      key: 'view',
      label: 'View details',
      icon: 'information-circle-outline' as const,
      onPress: () => {
        setShowOptions(false);
        if (selectedLoan) handleLoanPress(selectedLoan.loanId);
      }
    },
    {
      key: 'edit',
      label: 'Edit loan',
      icon: 'create-outline' as const,
      onPress: () => {
        setShowOptions(false);
        if (selectedLoan) router.push(`/loans/edit/${selectedLoan.loanId}`);
      }
    },
    {
      key: 'delete',
      label: 'Delete loan',
      icon: 'trash-outline' as const,
      destructive: true,
      onPress: () => {
        setShowOptions(false);
        setShowDeleteConfirm(true);
      }
    }
  ], [selectedLoan, handleLoanPress, router]);

  const renderItem = useCallback(({ item }: { item: LoanProgress }) => {
    const isPaid = item.percentage >= 100;
    const statusColor = item.type === 'BORROW' ? colors.danger : colors.success;

    return (
      <Card size="lg" variant="outlined" shadow="none" style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleLoanPress(item.loanId)}
          onLongPress={() => handleLoanLongPress(item)}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardInfo}>
              <Typography variant="h3" numberOfLines={1}>{item.name}</Typography>
              <View style={styles.typeBadge}>
                <Typography variant="label" color={statusColor}>{item.type}</Typography>
              </View>
            </View>
            <View style={styles.cardRight}>
              <MoneyText 
                amount={item.remaining} 
                currency={item.currency} 
                weight="sansBold" 
                style={styles.remainingAmount}
              />
              <Typography variant="label" color={colors.textMuted}>remaining</Typography>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressInfo}>
               <Typography variant="bodySm" color={colors.textMuted}>
                {isPaid ? 'Paid in full' : `Paid ${item.currency} ${item.paid.toLocaleString()} of ${item.total.toLocaleString()}`}
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
  }, [colors, styles, handleLoanPress, handleLoanLongPress]);

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Loans" 
        
        showBack 
        rightAction={
          <TouchableOpacity onPress={handleCreate} style={styles.headerBtn}>
            <Ionicons name="add" size={24} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      {loadingLoans || loadingProgress ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={progressData}
          keyExtractor={(item) => item.loanId.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              title="No loans found"
             
              icon="cash-outline"
              actionLabel="Add first loan"
              onAction={handleCreate}
            />
          }
        />
      )}

      <OptionsDialog
        visible={showOptions}
        onClose={() => setShowOptions(false)}
        title="Loan options"
        subtitle={selectedLoan?.name}
        options={options}
      />

      <ConfirmDialog
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete loan"
        message={`Are you sure you want to delete "${selectedLoan?.name}"? Repayment history will remain but won't be linked to this loan.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (selectedLoan) deleteLoan(selectedLoan.loanId);
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
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
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
