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
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { useDeleteLoan, useLoans, useLoansProgress } from '../api/loans';
import { LoanProgress } from '../services/loanQueries';

const LoanCard = React.memo(function LoanCard({
  item,
  onPress,
  onLongPress,
}: {
  item: LoanProgress;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createCardStyles(theme), [theme]);

  const isPaid = item.percentage >= 100;
  const isBorrow = item.type === 'BORROW';
  const statusColor = isBorrow ? colors.danger : colors.success;
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
            <View style={[styles.typeBadge, { backgroundColor: statusColor + '18' }]}>
              <Text style={[styles.typeBadgeText, { color: statusColor }]}>
                {isBorrow ? 'Borrowed' : 'Lent'}
              </Text>
            </View>
          </View>
          <View style={styles.amountBlock}>
            <MoneyText
              amount={item.remaining}
              currency={item.currency}
              weight="sansBold"
              style={styles.cardAmount}
            />
            <Text style={styles.cardSubLabel}>{isPaid ? 'paid off' : 'remaining'}</Text>
          </View>
        </View>

        <View style={styles.progressInfoRow}>
          <Text style={styles.progressLabel}>
            {isPaid ? 'Paid in full' : `Paid ${item.paid.toLocaleString()} of ${item.total.toLocaleString()}`}
          </Text>
          <Text style={[styles.progressPct, { color: statusColor }]}>{Math.round(pct)}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: statusColor }]} />
        </View>

        {isPaid && (
          <View style={[styles.paidPill, { backgroundColor: colors.success + '18' }]}>
            <Ionicons name="checkmark-circle" size={12} color={colors.success} />
            <Text style={[styles.paidText, { color: colors.success }]}>Paid in full</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

export const LoansScreen = React.memo(function LoansScreen() {
  const theme = useTheme();
  const { colors } = theme;
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
          { text: 'Upgrade now', onPress: () => router.push('/premium') },
        ],
      });
      return;
    }
    router.push('/loans/create');
  }, [router, isPremium, loans, showAlert]);

  const handleLoanPress = useCallback((loanId: number) => {
    router.push(`/loans/details/${loanId}`);
  }, [router]);

  const options = useMemo(() => [
    {
      key: 'view',
      label: 'View details',
      icon: 'information-circle-outline' as const,
      onPress: () => {
        setShowOptions(false);
        if (selectedLoan) handleLoanPress(selectedLoan.loanId);
      },
    },
    {
      key: 'edit',
      label: 'Edit loan',
      icon: 'create-outline' as const,
      onPress: () => {
        setShowOptions(false);
        if (selectedLoan) router.push(`/loans/edit/${selectedLoan.loanId}`);
      },
    },
    {
      key: 'delete',
      label: 'Delete loan',
      icon: 'trash-outline' as const,
      destructive: true,
      onPress: () => {
        setShowOptions(false);
        setShowDeleteConfirm(true);
      },
    },
  ], [selectedLoan, handleLoanPress, router]);

  const renderItem = useCallback(({ item }: { item: LoanProgress }) => (
    <LoanCard
      item={item}
      onPress={() => handleLoanPress(item.loanId)}
      onLongPress={() => { setSelectedLoan(item); setShowOptions(true); }}
    />
  ), [handleLoanPress]);

  const keyExtractor = useCallback((item: LoanProgress) => item.loanId.toString(), []);

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Loans"
        showBack
        rightAction={
          <TouchableOpacity onPress={handleCreate} activeOpacity={0.75}>
            <Ionicons name="add" size={26} color={colors.text} />
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
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cash-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No loans yet</Text>
              <Text style={styles.emptyText}>Track money you lend or borrow.</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={handleCreate} activeOpacity={0.8}>
                <Text style={styles.emptyBtnText}>Add first loan</Text>
              </TouchableOpacity>
            </View>
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
        message={`Delete "${selectedLoan?.name}"? Repayment history will remain but won't be linked to this loan.`}
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
    gap: theme.spacing[8],
    paddingRight: theme.spacing[12],
  },
  cardName: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: theme.fontSizes.md,
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
  },
  typeBadgeText: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 10,
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
  paidPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[4],
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  paidText: {
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
