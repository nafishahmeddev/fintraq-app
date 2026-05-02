import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme, useTheme } from '../../providers/ThemeProvider';
import { TransactionType } from '../../types';
import { MoneyText } from './MoneyText';
import { fromDbColor } from '../../utils/format';

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
  person?: {
    id: number;
    name: string;
  } | null;
  place?: {
    id: number;
    name: string;
  } | null;
};

type Props = {
  tx: TransactionData;
  onPress?: (tx: TransactionData) => void;
  isFirst?: boolean;
  isLast?: boolean;
  showDate?: boolean;
};

export const TransactionRow = React.memo(function TransactionRow({
  tx,
  onPress,
  isFirst,
  isLast,
  showDate
}: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const isTransfer = tx.type === 'TRANSFER';
  const categoryColor = useMemo(() => {
    if (isTransfer) return colors.primaryDark;
    if (!tx.category) return colors.textMuted;
    return fromDbColor(tx.category.color);
  }, [tx.category, isTransfer, colors.primaryDark, colors.textMuted]);

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
    backgroundColor: colors.card,
    borderTopLeftRadius: isFirst ? theme.radius.xl : 0,
    borderTopRightRadius: isFirst ? theme.radius.xl : 0,
    borderBottomLeftRadius: isLast ? theme.radius.xl : 0,
    borderBottomRightRadius: isLast ? theme.radius.xl : 0,
  }), [isFirst, isLast, colors.border, colors.card, theme.radius.xl]);

  const categoryName = isTransfer
    ? (tx.toAccount?.name ?? 'Transfer')
    : (tx.category?.name ?? 'Transaction');
  const displayNote = tx.note || categoryName;

  return (
    <TouchableOpacity
      style={[styles.container, containerStyle]}
      activeOpacity={0.7}
      onPress={handlePress}
    >
      <View
        style={[
          styles.iconBox,
          { backgroundColor: categoryColor + '12' },
        ]}
      >
        <Ionicons name={iconName} size={18} color={categoryColor} />
      </View>
      <View style={styles.info}>
        <Text
          style={styles.title}
          numberOfLines={1}
        >
          {displayNote}
        </Text>
        <View style={styles.metaRow}>
          <Text
            style={styles.meta}
            numberOfLines={1}
          >
            {isTransfer
              ? `To ${tx.toAccount?.name ?? 'account'} · ${tx.account.name}`
              : `${categoryName} · ${tx.account.name}${tx.person ? ` · ${tx.person.name}` : ''}${tx.place ? ` · ${tx.place.name}` : ''}`
            }
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        <MoneyText
          amount={tx.amount}
          currency={tx.account.currency}
          type={tx.type}
          weight="sansBold"
          style={styles.amount}
        />
        <Text style={styles.date}>
          {showDate
            ? format(new Date(tx.datetime), 'MMM d')
            : format(new Date(tx.datetime), 'HH:mm')}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

TransactionRow.displayName = 'TransactionRow';

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing[16],
    gap: theme.spacing[12],
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border + '10',
  },
  info: {
    flex: 1,
    gap: theme.spacing[2],
  },
  title: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[4],
  },
  meta: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textMuted,
  },
  right: {
    alignItems: 'flex-end',
    gap: theme.spacing[4],
  },
  amount: {
    fontSize: theme.fontSizes.sm,
  },
  date: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 10,
    color: theme.colors.textMuted,
  },
});
