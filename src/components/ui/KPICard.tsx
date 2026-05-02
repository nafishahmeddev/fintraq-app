import React, { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme, useTheme } from '../../providers/ThemeProvider';
import { MoneyText } from './MoneyText';

type KPIMetrics = {
  income: number;
  expense: number;
};

type Props = {
  currencies: string[];
  selectedCurrency: string | null;
  onSelectCurrency: (currency: string) => void;
  metrics: KPIMetrics;
};

/**
 * KPICard - Editorial Brutalist Design
 * 
 * Structure:
 * - Card: 16px radius (lg), 16px padding, surface background
 * - Currency tabs: pill radius (full), 8px gap
 * - Labels: Uppercase, 9-10px, letterSpacing 1.2
 * - Values: 24px large / 14px small
 */
export const KPICard = React.memo(function KPICard({
  currencies,
  selectedCurrency,
  onSelectCurrency,
  metrics,
}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleCurrencyPress = useCallback((curr: string) => {
    onSelectCurrency(curr);
  }, [onSelectCurrency]);

  return (
    <View style={styles.kpiCard}>
      {currencies.length > 1 && (
        <View style={styles.kpiTabsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.currencyTabsRow}
          >
            {currencies.map((cur) => (
              <TouchableOpacity
                key={cur}
                style={[
                  styles.currencyTab,
                  selectedCurrency === cur && styles.currencyTabActive,
                ]}
                onPress={() => handleCurrencyPress(cur)}
                activeOpacity={0.75}
              >
                <Text style={[
                  styles.currencyTabText,
                  selectedCurrency === cur && styles.currencyTabTextActive,
                ]}>
                  {cur}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.kpiBody}>
        {/* Top: Net Balance */}
        <View style={styles.kpiMainContent}>
          <View>
            <Text style={styles.kpiLabel}>NET SAVINGS</Text>
            <MoneyText
              amount={Math.abs(metrics.income - metrics.expense)}
              currency={selectedCurrency ?? undefined}
              type={metrics.income >= metrics.expense ? 'CR' : 'DR'}
              weight="sansBold"
              style={styles.kpiValueLarge}
            />
          </View>
        </View>

        <View style={styles.kpiDivider} />

        {/* Bottom: In/Out Split */}
        <View style={styles.kpiSecondaryContent}>
          <View style={styles.kpiCell}>
            <Text style={styles.kpiLabelSmall}>INCOME</Text>
            <MoneyText
              amount={metrics.income}
              currency={selectedCurrency ?? undefined}
              type="CR"
              weight="sansSemiBold"
              style={styles.kpiValueSmall}
            />
          </View>
          <View style={styles.kpiVerticalSep} />
          <View style={styles.kpiCell}>
            <Text style={styles.kpiLabelSmall}>EXPENSES</Text>
            <MoneyText
              amount={metrics.expense}
              currency={selectedCurrency ?? undefined}
              type="DR"
              weight="sansSemiBold"
              style={styles.kpiValueSmall}
            />
          </View>
        </View>
      </View>
    </View>
  );
});

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    kpiCard: {
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    kpiTabsWrap: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingVertical: 8,
      paddingLeft: 12,
    },
    currencyTabsRow: {
      flexDirection: 'row',
      gap: 8,
      paddingRight: 12,
    },
    currencyTab: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    currencyTabActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    currencyTabText: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 12,
      color: theme.colors.textMuted,
      letterSpacing: 0.3,
    },
    currencyTabTextActive: {
      color: theme.colors.background,
    },
    kpiBody: {
      padding: 16,
      gap: 12,
    },
    kpiMainContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    kpiSecondaryContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    kpiCell: {
      flex: 1,
      gap: 2,
    },
    kpiVerticalSep: {
      width: 1,
      height: 24,
      backgroundColor: theme.colors.border,
      marginHorizontal: 16,
      opacity: 0.6,
    },
    kpiLabel: {
      color: theme.colors.textMuted,
      fontFamily: theme.fontFamilies.sansBold,
      fontSize: 10,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      marginBottom: 2,
    },
    kpiLabelSmall: {
      color: theme.colors.textMuted,
      fontFamily: theme.fontFamilies.sansBold,
      fontSize: 9,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    kpiValueLarge: {
      fontSize: 24,
      lineHeight: 28,
    },
    kpiValueSmall: {
      fontSize: 14,
      lineHeight: 18,
    },
    kpiDivider: {
      height: 1,
      backgroundColor: theme.colors.border,
      opacity: 0.5,
    },
  });
