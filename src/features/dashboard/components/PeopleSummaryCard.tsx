import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MoneyText } from '../../../components/core/MoneyText';
import { useSettings } from '../../../providers/SettingsProvider';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { usePeople } from '../../people/api/people';
import { useTransactions } from '../../transactions/hooks/transactions';

export const PeopleSummaryCard = React.memo(function PeopleSummaryCard() {
  const theme = useTheme();
  const { colors } = theme;
  const { profile } = useSettings();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { data: people } = usePeople();
  const { data: transactions } = useTransactions(200);

  const summary = useMemo(() => {
    if (!people || people.length === 0) return null;
    const spent = (transactions ?? [])
      .filter(tx => tx.type === 'DR' && tx.person && tx.account.currency === profile.defaultCurrency)
      .reduce((s, tx) => s + tx.amount, 0);
    return { count: people.length, spent };
  }, [people, transactions, profile.defaultCurrency]);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(summary ? '/people' : '/people/create')}
      activeOpacity={0.7}
    >
      <Text style={styles.label}>People</Text>
      {summary ? (
        <>
          <View style={styles.countRow}>
            <Text style={styles.countNum}>{summary.count}</Text>
            <Ionicons name="people-outline" size={16} color={colors.textMuted} />
          </View>
          <View style={styles.spendRow}>
            <MoneyText amount={summary.spent} currency={profile.defaultCurrency} type="DR" style={styles.spend} weight="sansBold" />
            <Text style={styles.spendLabel}>spent</Text>
          </View>
        </>
      ) : (
        <Text style={styles.empty}>No contacts yet</Text>
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
  countRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing[4],
  },
  countNum: {
    fontFamily: theme.fontFamilies.heading,
    fontSize: 28,
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  spendRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing[4],
  },
  spend: {
    fontSize: 14,
  },
  spendLabel: {
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
