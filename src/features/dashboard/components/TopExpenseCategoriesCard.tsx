import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MoneyText } from '../../../components/ui/MoneyText';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { resolveIcon } from '../../../utils/icons';

type TopExpenseCategory = {
  name: string;
  icon: string;
  color: number;
  amount: number;
};

type TopExpenseCategoriesCardProps = {
  selectedCurrency: string;
  categories: TopExpenseCategory[];
};

export const TopExpenseCategoriesCard = React.memo(function TopExpenseCategoriesCard({
  selectedCurrency,
  categories,
}: TopExpenseCategoriesCardProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const maxAmount = useMemo(
    () => categories.reduce((max, item) => (item.amount > max ? item.amount : max), 0),
    [categories]
  );


  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.cardLabel}>Top expenses</Text>
      </View>

      <View style={styles.content}>
        {categories.length > 0 ? (
          categories.map((category, idx) => {
            const isLast = idx === categories.length - 1;
            const accent = `#${category.color.toString(16).padStart(6, '0')}`;
            const ratio = maxAmount > 0 ? category.amount / maxAmount : 0;
            return (
              <View key={`${category.name}-${idx}`} style={[styles.row, isLast && styles.rowLast]}>
                <View style={styles.left}>
                  <View style={[styles.iconWrap, { backgroundColor: accent + '18' }]}>
                    <Ionicons name={resolveIcon(category.icon, 'pricetag-outline')} size={14} color={accent} />
                  </View>
                  <View style={styles.meta}>
                    <Text style={styles.name} numberOfLines={1}>{category.name}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${Math.max(6, ratio * 100)}%`, backgroundColor: accent }]} />
                    </View>
                  </View>
                </View>
                <View style={styles.right}>
                  <MoneyText amount={category.amount} currency={selectedCurrency} type="DR" weight="sansBold" style={styles.amount} />
                  <Text style={styles.percent}>{`${(ratio * 100).toFixed(0)}%`}</Text>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.empty}>
            <Ionicons name="pie-chart-outline" size={18} color={theme.colors.textMuted} />
            <Text style={styles.emptyText}>No expense data for {selectedCurrency}</Text>
          </View>
        )}
      </View>
    </View>
  );
});

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      marginHorizontal: theme.layout.screenPadding,
      borderRadius: theme.radius['3xl'],
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
      marginBottom: theme.spacing[24],
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing[20],
      paddingTop: theme.spacing[20],
      paddingBottom: theme.spacing[16],
    },
    cardLabel: {
      fontFamily: theme.fontFamilies.sansBold,
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    content: {
      paddingBottom: theme.spacing[4],
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing[12],
      paddingHorizontal: theme.spacing[20],
      paddingVertical: theme.spacing[12],
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    left: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[12],
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: theme.radius.full,
      justifyContent: 'center',
      alignItems: 'center',
    },
    meta: {
      flex: 1,
    },
    name: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      color: theme.colors.text,
      fontSize: 13,
      marginBottom: 6,
    },
    barTrack: {
      height: 4,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.background,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: theme.radius.full,
      minWidth: 6,
    },
    right: {
      minWidth: 80,
      alignItems: 'flex-end',
    },
    amount: {
      fontSize: 13,
    },
    percent: {
      marginTop: 2,
      fontFamily: theme.fontFamilies.sans,
      color: theme.colors.textMuted,
      fontSize: 10,
    },
    empty: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[8],
      paddingHorizontal: theme.spacing[20],
      paddingVertical: theme.spacing[20],
    },
    emptyText: {
      fontFamily: theme.fontFamilies.sans,
      color: theme.colors.textMuted,
      fontSize: 13,
    },
  });
