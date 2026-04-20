import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../../../components/ui/EmptyState';
import { MoneyText } from '../../../components/ui/MoneyText';
import { useTheme } from '../../../providers/ThemeProvider';
import { spacing, radius } from '../../../theme/tokens';
import { TYPOGRAPHY } from '../../../theme/typography';

type IoniconName = keyof typeof Ionicons.glyphMap;

type TopExpenseCategory = {
  name: string;
  icon: string;
  color: number;
  amount: number;
};

type TopExpenseCategoriesCardProps = {
  currency: string;
  categories: TopExpenseCategory[];
};

const resolveIconName = (raw: string | null | undefined, fallback: IoniconName): IoniconName => {
  if (raw && raw in Ionicons.glyphMap) return raw as IoniconName;
  if (raw) {
    const outlined = `${raw}-outline`;
    if (outlined in Ionicons.glyphMap) return outlined as IoniconName;
  }
  return fallback;
};

export const TopExpenseCategoriesCard = React.memo(function TopExpenseCategoriesCard({
  currency,
  categories,
}: TopExpenseCategoriesCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const maxAmount = useMemo(
    () => categories.reduce((max, item) => (item.amount > max ? item.amount : max), 0),
    [categories]
  );

  if (categories.length === 0) {
    return (
      <View style={styles.card}>
        <EmptyState
          icon="pie-chart-outline"
          title="No expenses yet"
          description={`Add expense transactions in ${currency} to see your top categories.`}
          size="compact"
          variant="card"
          fullHeight={false}
        />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {categories.map((category, idx) => {
        const accent = `#${category.color.toString(16).padStart(6, '0')}`;
        const ratio = maxAmount > 0 ? category.amount / maxAmount : 0;
        return (
          <React.Fragment key={`${category.name}-${idx}`}>
            <View style={styles.row}>
              <View style={styles.left}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>{idx + 1}</Text>
                </View>
                <View style={[styles.iconWrap, { backgroundColor: accent + '22' }]}>
                  <Ionicons name={resolveIconName(category.icon, 'pricetag-outline')} size={14} color={accent} />
                </View>
                <View style={styles.meta}>
                  <Text style={styles.name} numberOfLines={1}>{category.name}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${Math.max(8, ratio * 100)}%`, backgroundColor: accent }]} />
                  </View>
                </View>
              </View>
              <View style={styles.right}>
                <MoneyText amount={category.amount} currency={currency} type="DR" weight="bold" style={styles.amount} showSign={false} />
                <Text style={styles.percent}>{`${(ratio * 100).toFixed(0)}%`}</Text>
              </View>
            </View>
            {idx < categories.length - 1 && <View style={styles.divider} />}
          </React.Fragment>
        );
      })}
    </View>
  );
});

const createStyles = (colors: { [key: string]: string }) =>
  StyleSheet.create({
    card: {
      marginHorizontal: spacing('6'),
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
      overflow: 'hidden',
      marginBottom: spacing('6'),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing('3'),
      paddingHorizontal: spacing('3.5'),
      paddingVertical: spacing('2.5'),
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: spacing('3.5'),
    },
    left: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
    },
    rankBadge: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
    },
    rankText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      color: colors.textMuted,
      fontSize: 10,
    },
    iconWrap: {
      width: 28,
      height: 28,
      borderRadius: 9,
      justifyContent: 'center',
      alignItems: 'center',
    },
    meta: {
      flex: 1,
    },
    name: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      color: colors.text,
      fontSize: 12,
      marginBottom: 5,
    },
    barTrack: {
      height: 4,
      borderRadius: 999,
      backgroundColor: colors.card,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 999,
      minWidth: 8,
    },
    right: {
      minWidth: 88,
      alignItems: 'flex-end',
    },
    amount: {
      fontSize: 13,
      lineHeight: 15,
    },
    percent: {
      marginTop: 3,
      fontFamily: TYPOGRAPHY.fonts.regular,
      color: colors.textMuted,
      fontSize: 10,
    },
  });
