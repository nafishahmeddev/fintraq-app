import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import React, { useCallback, useMemo } from 'react';
import { TransactionType } from '../../types';
import { useTheme } from '../../providers/ThemeProvider';
import { MoneyText } from './MoneyText';
import { Pressable } from './Pressable';
import { Box } from './Box';
import { Text, cn } from './Text';

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
  onPress?: (tx: TransactionData) => void;
  isFirst?: boolean;
  isLast?: boolean;
  showDate?: boolean;
};

const toHexColor = (value: number) => `#${value.toString(16).padStart(6, '0')}`;

export const TransactionRow = React.memo(function TransactionRow({
  tx,
  onPress,
  isFirst,
  isLast,
  showDate
}: Props) {
  const { isDark } = useTheme();

  const isTransfer = tx.type === 'TRANSFER';

  const categoryColor = useMemo(() => {
    if (isTransfer) return isDark ? '#B8D641' : '#a6c13a'; // primary
    if (!tx.category) return isDark ? '#b2bb8b' : '#737a5f'; // textMuted
    return toHexColor(tx.category.color);
  }, [tx.category, isTransfer, isDark]);

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

  const categoryName = isTransfer
    ? (tx.toAccount?.name ?? 'Transfer')
    : (tx.category?.name ?? 'Transaction');
  const displayNote = tx.note || categoryName;

  return (
    <Pressable
      className={cn(
        'flex-row items-center p-3.5 space-x-2.5 bg-surface border-b border-border',
        isFirst && 'rounded-t-2xl',
        isLast && 'rounded-b-2xl border-b-0'
      )}
      onPress={handlePress}
    >

      <Box
        className="w-10 h-10 rounded-2xl items-center justify-center"
        style={{ backgroundColor: categoryColor + '20' }}
      >
        <Ionicons name={iconName} size={18} color={categoryColor} />
      </Box>
      <Box className="flex-1 justify-center space-y-1">
        <Text
          className="font-semibold text-sm text-text"
          numberOfLines={1}
        >
          {displayNote}
        </Text>
        <Box className="flex-row items-center space-x-1">
          <Text
            className="font-regular text-xs text-text-muted"
            numberOfLines={1}
          >
            {isTransfer
              ? `Transfer to ${tx.toAccount?.name ?? 'account'} · ${tx.account.name}`
              : `${categoryName} · ${tx.account.name}`
            }
          </Text>
        </Box>
      </Box>
      <Box className="items-end justify-center space-y-1">
        <MoneyText
          amount={tx.amount}
          currency={tx.account.currency}
          type={tx.type}
          className="text-sm"
        />
        <Text className="font-regular text-[11px] text-text-muted">
          {showDate
            ? format(new Date(tx.datetime), 'MMM d')
            : format(new Date(tx.datetime), 'HH:mm')}
        </Text>
      </Box>
    </Pressable>
  );
});

TransactionRow.displayName = 'TransactionRow';
