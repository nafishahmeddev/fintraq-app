import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MoneyText } from '../../../components/ui/MoneyText';
import { Theme, useTheme } from '../../../providers/ThemeProvider';

type IoniconName = keyof typeof Ionicons.glyphMap;

type TopExpenseCategory = {
  name: string;
  icon: string;
  color: number;
  amount: number;
};

type TopExpenseCategoriesCardProps = {
  currencies: string[];
  selectedCurrency: string;
  onSelectCurrency: (value: string) => void;
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
  currencies,
  selectedCurrency,
  onSelectCurrency,
  categories,
}: TopExpenseCategoriesCardProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const maxAmount = useMemo(
    () => categories.reduce((max, item) => (item.amount > max ? item.amount : max), 0),
    [categories]
  );

  const handleCurrencyPress = useCallback((curr: string) => {
    onSelectCurrency(curr);
  }, [onSelectCurrency]);

  return (
    <View style={styles.card}>
      {currencies.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {currencies.map((curr) => (
            <TouchableOpacity
              key={curr}
              style={[styles.tab, selectedCurrency === curr && styles.tabActive]}
              onPress={() => handleCurrencyPress(curr)}
              activeOpacity={0.85}
            >
              <Text style={[styles.tabText, selectedCurrency === curr && styles.tabTextActive]}>{curr}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.content}>
        {categories.length > 0 ? (
          categories.map((category, idx) => {
            const isLast = idx === categories.length - 1;
            const accent = `#${category.color.toString(16).padStart(6, '0')}`;
            const ratio = maxAmount > 0 ? category.amount / maxAmount : 0;
            return (
              <View key={`${category.name}-${idx}`} style={[styles.row, isLast && styles.rowLast]}>
                <View style={styles.left}>
                  <View style={[styles.iconWrap, { backgroundColor: accent + '15' }]}>
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
                  <MoneyText amount={category.amount} currency={selectedCurrency} type="DR" weight="sansBold" style={styles.amount} />
                  <Text style={styles.percent}>{`${(ratio * 100).toFixed(0)}%`}</Text>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.empty}>
            <Ionicons name="pie-chart-outline" size={18} color={theme.colors.textMuted} />
            <Text style={styles.emptyText}>No expense data yet for {selectedCurrency}</Text>
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
      borderRadius: theme.radius.xl,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
      marginBottom: theme.spacing[24],
      ...theme.shadow.xs,
    },
    tabsRow: {
      flexDirection: 'row',
      gap: theme.spacing[8],
      paddingHorizontal: theme.spacing[12],
      paddingTop: theme.spacing[12],
      paddingBottom: theme.spacing[8],
    },
    tab: {
      height: 28,
      borderRadius: theme.radius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      paddingHorizontal: theme.spacing[12],
      justifyContent: 'center',
    },
    tabActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    tabText: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      color: theme.colors.textMuted,
      fontSize: theme.fontSizes.xs,
    },
    tabTextActive: {
      color: theme.colors.onPrimary,
    },
    content: {
      padding: theme.spacing[4],
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing[12],
      paddingHorizontal: theme.spacing[12],
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
      borderRadius: theme.radius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    meta: {
      flex: 1,
    },
    name: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      color: theme.colors.text,
      fontSize: theme.fontSizes.sm,
      marginBottom: 6,
    },
    barTrack: {
      height: 6,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.background,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: theme.radius.full,
      minWidth: 8,
    },
    right: {
      minWidth: 80,
      alignItems: 'flex-end',
    },
    amount: {
      fontSize: theme.fontSizes.sm,
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
      paddingHorizontal: theme.spacing[12],
      paddingVertical: theme.spacing[16],
    },
    emptyText: {
      fontFamily: theme.fontFamilies.sans,
      color: theme.colors.textMuted,
      fontSize: theme.fontSizes.sm,
    },
  });
