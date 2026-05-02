import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { useLoansProgress } from '../../loans/api/loans';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { useSettings } from '../../../providers/SettingsProvider';
import { SectionHeader } from './SectionHeader';
import { formatCurrency } from '../../../utils/format';

export const LoansSummaryCard = React.memo(function LoansSummaryCard() {
  const theme = useTheme();
  const { profile } = useSettings();
  const router = useRouter();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const { data: progressData, isLoading } = useLoansProgress();

  if (isLoading) {
    return null;
  }

  const hasLoans = progressData && progressData.length > 0;

  return (
    <View style={styles.container}>
      <SectionHeader 
        title="LOANS" 
        rightText={hasLoans ? "See all" : "New"} 
        onPressRight={() => router.push(hasLoans ? '/loans' : '/loans/create')} 
      />

      {hasLoans ? (
        <View style={styles.card}>
          {([...progressData]
            .sort((a, b) => b.remaining - a.remaining)
            .slice(0, 2)).map((loan, index, arr) => {
            const statusColor = loan.type === 'BORROW' ? theme.colors.danger : theme.colors.success;

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
                      <Text style={styles.loanName} numberOfLines={1}>
                        {loan.name}
                      </Text>
                      <Text style={[styles.loanType, { color: statusColor }]}>{loan.type}</Text>
                    </View>
                    <Text style={styles.loanAmount}>
                      {formatCurrency(loan.remaining, profile.defaultCurrency)}{' '}
                      <Text style={styles.amountLabel}>left</Text>
                    </Text>
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
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.emptyCard} 
          onPress={() => router.push('/loans/create')}
          activeOpacity={0.7}
        >
          <Text style={styles.emptyText}>
            Keep track of money you owe or are owed by others.
          </Text>
          <Text style={styles.emptyAction}>
            + Create Loan
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    marginBottom: theme.spacing[24],
  },
  card: {
    marginHorizontal: theme.layout.screenPadding,
    padding: theme.spacing[16],
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.xs,
  },
  loanItem: {
    paddingVertical: theme.spacing[4],
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    borderStyle: 'dashed',
    marginBottom: theme.spacing[12],
    paddingBottom: theme.spacing[12],
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[12],
  },
  loanInfo: {
    flex: 1,
  },
  loanName: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: theme.fontSizes.md,
    color: theme.colors.text,
  },
  loanType: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  loanAmount: {
    fontFamily: theme.fontFamilies.monoBold,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text,
  },
  amountLabel: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radius.full,
  },
  emptyCard: {
    marginHorizontal: theme.layout.screenPadding,
    padding: theme.spacing[24],
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyAction: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.primaryDark,
    marginTop: theme.spacing[12],
  },
});
