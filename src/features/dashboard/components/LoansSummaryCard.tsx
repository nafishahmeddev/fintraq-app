import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MoneyText } from '../../../components/core/MoneyText';
import { useSettings } from '../../../providers/SettingsProvider';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { useLoansProgress } from '../../loans/api/loans';

export const LoansSummaryCard = React.memo(function LoansSummaryCard() {
  const theme = useTheme();
  const { colors } = theme;
  const { profile } = useSettings();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { data: progressData } = useLoansProgress();

  const summary = useMemo(() => {
    if (!progressData || progressData.length === 0) return null;
    const borrows = progressData.filter(l => l.type === 'BORROW');
    const lends = progressData.filter(l => l.type === 'LEND');
    const balance = progressData.reduce((s, l) => s + l.remaining, 0);
    return { total: progressData.length, borrows: borrows.length, lends: lends.length, balance };
  }, [progressData]);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(summary ? '/loans' : '/loans/create')}
      activeOpacity={0.7}
    >
      <Text style={styles.label}>Loans</Text>
      {summary ? (
        <>
          <View style={styles.countsRow}>
            <View style={styles.countBlock}>
              <Text style={[styles.countNum, { color: colors.danger }]}>{summary.borrows}</Text>
              <Text style={styles.countLabel}>Borrowing</Text>
            </View>
            <View style={styles.countBlock}>
              <Text style={[styles.countNum, { color: colors.success }]}>{summary.lends}</Text>
              <Text style={styles.countLabel}>Lending</Text>
            </View>
          </View>
          <View style={styles.balanceRow}>
            <MoneyText amount={summary.balance} currency={profile.defaultCurrency} type="DR" style={styles.balance} weight="sansBold" />
            <Text style={styles.balanceLabel}>outstanding</Text>
          </View>
        </>
      ) : (
        <Text style={styles.empty}>No active loans</Text>
      )}
    </TouchableOpacity>
  );
});

const createStyles = (theme: Theme) => StyleSheet.create({
  card: {
    flex: 1,
    padding: theme.spacing[16],
    borderRadius: theme.radius['3xl'],
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing[8],
  },
  label: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  countsRow: {
    flexDirection: 'row',
    gap: theme.spacing[16],
  },
  countBlock: {
    gap: 2,
  },
  countNum: {
    fontFamily: theme.fontFamilies.heading,
    fontSize: 28,
    letterSpacing: -0.5,
  },
  countLabel: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing[4],
  },
  balance: {
    fontSize: 14,
  },
  balanceLabel: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  empty: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
});
