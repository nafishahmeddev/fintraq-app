import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TransactionRow } from '../../../components/ui/TransactionRow';
import { SectionHeader } from '../components/SectionHeader';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import type { TransactionListItem } from '../../transactions/api/transactions';

interface ActivityFeedProps {
  transactions: TransactionListItem[] | undefined;
  onViewAll: () => void;
  onEditTransaction: (txId: number) => void;
  onCreateTransaction: () => void;
}

export const ActivityFeed = React.memo(function ActivityFeed({
  transactions,
  onViewAll,
  onEditTransaction,
  onCreateTransaction,
}: ActivityFeedProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <>
      <SectionHeader title="Recent" rightText="See all" onPressRight={onViewAll} />

      <View style={[styles.activityCard, { backgroundColor: "transparent" }]}>
        {transactions && transactions.length > 0 ? (
          transactions.slice(0, 6).map((tx, idx) => {
            const isLast = idx === Math.min(transactions.length, 6) - 1;
            return (
              <TransactionRow
                key={tx.id}
                tx={tx}
                isFirst={idx === 0}
                isLast={isLast}
                showDate
                onPress={() => onEditTransaction(tx.id)}
              />
            );
          })
        ) : (
          <View style={styles.emptyActivity}>
            <Ionicons name="receipt-outline" size={28} color={colors.primary} />
            <Text style={styles.emptyActivityText}>No transactions yet</Text>
            <TouchableOpacity style={styles.emptyActivityAction} onPress={onCreateTransaction}>
              <Text style={styles.emptyActivityActionText}>Add one now</Text>
              <Ionicons name="arrow-forward" size={12} color={colors.onPrimary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </>
  );
});

const createStyles = (theme: Theme) => StyleSheet.create({
  activityCard: {
    marginHorizontal: theme.layout.screenPadding,
    marginBottom: theme.spacing[24],
  },
  emptyActivity: {
    padding: theme.spacing[32],
    alignItems: 'center',
    gap: theme.spacing[12],
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['3xl'],
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  emptyActivityText: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  emptyActivityAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[8],
    paddingHorizontal: theme.spacing[16],
    height: 36,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary,
  },
  emptyActivityActionText: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 12,
    color: theme.colors.onPrimary,
  },
});
