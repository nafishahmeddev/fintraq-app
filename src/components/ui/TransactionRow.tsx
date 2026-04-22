import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { RADIUS, spacing } from '../../theme/tokens';
import { TYPOGRAPHY } from '../../theme/typography';
import { TransactionType } from '../../types';
import { MoneyText } from './MoneyText';

type TransactionData = {
  id: number;
  type: TransactionType;
  amount: number;
  note: string;
  datetime: string;
  account: {
    name: string;
    currency: string;
  };
  toAccount?: {
    name: string;
  } | null;
  category?: {
    name: string;
    icon: string;
    color: number;
  } | null;
};

type Props = {
  tx: TransactionData;
  colors: ThemeColors;
  onPress?: (tx: TransactionData) => void;
  isFirst?: boolean;
  isLast?: boolean;
  showDate?: boolean;
};

const toHexColor = (value: number) => `#${value.toString(16).padStart(6, '0')}`;

/**
 * TransactionRow - Editorial Brutalist Design
 * 
 * Layout:
 * - Card radius: 0 for middle items, 16px (lg) for first/last corners
 * - Padding: 14px vertical
 * - Gap: 10px between elements
 * - Icon box: 40px, 12px radius (md)
 */
export const TransactionRow = React.memo(function TransactionRow({
  tx,
  colors,
  onPress,
  isFirst,
  isLast,
  showDate
}: Props) {
  const styles = useMemo(() => createStyles(colors), [colors]);

  const isTransfer = tx.type === 'TRANSFER';
  const categoryColor = useMemo(() => {
    if (isTransfer) return colors.primary;
    if (!tx.category) return colors.textMuted;
    return toHexColor(tx.category.color);
  }, [tx.category, isTransfer, colors.primary, colors.textMuted]);

  const iconName: keyof typeof Ionicons.glyphMap = useMemo(() => {
    if (isTransfer) return 'swap-horizontal-outline';
    if (!tx.category) return 'pricetag-outline';
    return tx.category.icon in Ionicons.glyphMap
      ? (tx.category.icon as keyof typeof Ionicons.glyphMap)
      : 'pricetag-outline';
  }, [tx.category, isTransfer]);

  const handlePress = useCallback(() => {
    onPress?.(tx);
  }, [onPress, tx]);

  const containerStyle = useMemo(() => ({
    borderBottomWidth: isLast ? 0 : 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    borderTopLeftRadius: isFirst ? RADIUS['2xl'] : 0,
    borderTopRightRadius: isFirst ? RADIUS['2xl'] : 0,
    borderBottomLeftRadius: isLast ? RADIUS['2xl'] : 0,
    borderBottomRightRadius: isLast ? RADIUS['2xl'] : 0,
  }), [isFirst, isLast, colors.border, colors.surface]);

  const categoryName = isTransfer
    ? (tx.toAccount?.name ?? 'Transfer')
    : (tx.category?.name ?? 'Transaction');
  const displayNote = tx.note || categoryName;

  return (
    <TouchableOpacity
      style={[styles.container, containerStyle]}
      activeOpacity={0.75}
      onPress={handlePress}
    >

      <View
        style={[
          styles.iconBox,
          { backgroundColor: categoryColor + '20' },
        ]}
      >
        <Ionicons name={iconName} size={18} color={categoryColor} />
      </View>
      <View style={styles.info}>
        <Text
          style={[styles.title, { color: colors.text }]}
          numberOfLines={1}
        >
          {displayNote}
        </Text>
        <View style={styles.metaRow}>
          <Text
            style={[styles.meta, { color: colors.textMuted }]}
            numberOfLines={1}
          >
            {isTransfer
              ? `Transfer to ${tx.toAccount?.name ?? 'account'} · ${tx.account.name}`
              : `${categoryName} · ${tx.account.name}`
            }
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        <MoneyText
          amount={tx.amount}
          currency={tx.account.currency}
          type={tx.type}
          weight="bold"
          style={styles.amount}
        />
        <Text style={[styles.date, { color: colors.textMuted }]}>
          {showDate
            ? format(new Date(tx.datetime), 'MMM d')
            : format(new Date(tx.datetime), 'HH:mm')}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

TransactionRow.displayName = 'TransactionRow';

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing('3.5'),
    gap: spacing('2.5'),
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: spacing('1'),
  },
  title: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('1'),
  },
  meta: {
    fontFamily: TYPOGRAPHY.fonts.regular,
    fontSize: 12,
  },
  right: {
    alignItems: 'flex-end',
    gap: spacing('1'),
  },
  amount: {
    fontSize: 14,
  },
  date: {
    fontFamily: TYPOGRAPHY.fonts.regular,
    fontSize: 11,
  },
});
