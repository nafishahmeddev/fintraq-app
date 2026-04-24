import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useLoansProgress } from '../../loans/api/loans';
import { useTheme } from '../../../providers/ThemeProvider';
import { useSettings } from '../../../providers/SettingsProvider';
import { ThemeColors } from '../../../theme/colors';
import { radius, spacing, LAYOUT } from '../../../theme/tokens';
import { Typography, Card } from '../../../components/ui';
import { SectionHeader } from './SectionHeader';
import { formatCurrency } from '../../../utils/format';

export const LoansSummaryCard = React.memo(function LoansSummaryCard() {
  const { colors } = useTheme();
  const { profile } = useSettings();
  const router = useRouter();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const { data: progressData, isLoading } = useLoansProgress();

  const hasLoans = progressData && progressData.length > 0;

  return (
    <View style={styles.container}>
      <SectionHeader 
        title="LOANS" 
        rightText={hasLoans ? "See all" : "New"} 
        onPressRight={() => router.push(hasLoans ? '/loans' : '/loans/create')} 
      />

      {hasLoans ? (
        <Card variant="outlined" size="lg" shadow="none" style={styles.card}>
          {([...progressData]
            .sort((a, b) => b.remaining - a.remaining)
            .slice(0, 2)).map((loan, index, arr) => {
            const statusColor = loan.type === 'BORROW' ? colors.danger : colors.success;

            return (
              <View
                key={loan.loanId}
                style={[styles.loanItem, index < arr.length - 1 && styles.borderBottom]}
              >
                <TouchableOpacity
                  onPress={() => router.push(`/loans/details/${loan.loanId}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.loanHeader}>
                    <View style={styles.loanInfo}>
                      <Typography variant="body" weight="semibold" numberOfLines={1}>
                        {loan.name}
                      </Typography>
                      <Typography variant="label" color={statusColor} style={{ fontSize: 9 }}>{loan.type}</Typography>
                    </View>
                    <Typography variant="mono" weight="semibold">
                      {formatCurrency(loan.remaining, profile.defaultCurrency)}{' '}
                      <Typography variant="label" color={colors.textMuted}>left</Typography>
                    </Typography>
                  </View>

                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${Math.min(loan.percentage, 100)}%`, 
                          backgroundColor: statusColor 
                        }
                      ]} 
                    />
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </Card>
      ) : (
        <TouchableOpacity 
          style={styles.emptyCard} 
          onPress={() => router.push('/loans/create')}
          activeOpacity={0.7}
        >
          <Typography variant="bodySm" color={colors.textMuted} align="center">
            Keep track of money you owe or are owed by others.
          </Typography>
          <Typography variant="bodySm" color={colors.primary} weight="bold" style={{ marginTop: spacing('2') }}>
            + Create Loan
          </Typography>
        </TouchableOpacity>
      )}
    </View>
  );
});

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    marginBottom: spacing('6'),
  },
  card: {
    marginHorizontal: LAYOUT.screenPadding,
    padding: spacing('4'),
  },
  loanItem: {
    paddingVertical: spacing('1'),
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderStyle: 'dashed',
    marginBottom: spacing('4'),
    paddingBottom: spacing('4'),
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing('2.5'),
  },
  loanInfo: {
    flex: 1,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border + '40',
    borderRadius: radius('full'),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius('full'),
  },
  emptyCard: {
    marginHorizontal: LAYOUT.screenPadding,
    padding: spacing('6'),
    borderRadius: radius('xl'),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
