import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { formatCurrency } from '../../../utils/format';
import { DashboardInsight } from '../api/insights';

interface InsightCardProps {
  insight: DashboardInsight;
}

export const InsightCard = React.memo(function InsightCard({ insight }: InsightCardProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const status = useMemo(() => {
    switch (insight.type) {
      case 'success': return { bg: colors.success + '15', text: colors.success };
      case 'danger': return { bg: colors.danger + '15', text: colors.danger };
      case 'warning': return { bg: colors.warning + '15', text: colors.warning };
      case 'info': return { bg: colors.primaryDark + '15', text: colors.primaryDark };
      default: return { bg: colors.card, text: colors.text };
    }
  }, [insight.type, colors]);

  const displayValue = useMemo(() => {
    switch (insight.valueType) {
      case 'amount':
        return formatCurrency(insight.amount, insight.currency);
      case 'percentage':
        return `${insight.percentage > 0 ? '+' : ''}${insight.percentage.toFixed(0)}%`;
      case 'text':
        return insight.text;
    }
  }, [insight]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: status.bg }]}>
          <Ionicons name={insight.icon} size={16} color={status.text} />
        </View>
        <Text style={styles.title}>{insight.title.toUpperCase()}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
          {displayValue}
        </Text>
        <View style={styles.trendContainer}>
          <Text style={styles.subtitle} numberOfLines={1}>
            {insight.subtitle}
          </Text>
          {insight.trend && (
            <Ionicons
              name={insight.trend === 'up' ? 'arrow-up' : 'arrow-down'}
              size={12}
              color={insight.type === 'danger' ? colors.danger : colors.success}
              style={styles.trendIcon}
            />
          )}
        </View>
      </View>
    </View>
  );
});

const createStyles = (theme: Theme) => StyleSheet.create({
  card: {
    width: 220,
    minHeight: 120,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing[16],
    marginRight: theme.spacing[12],
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
    ...theme.shadow.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[8],
    marginBottom: theme.spacing[8],
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border + '10',
  },
  title: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 9,
    letterSpacing: 1.5,
    color: theme.colors.textMuted,
  },
  body: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  value: {
    fontFamily: theme.fontFamilies.monoBold,
    fontSize: 26,
    letterSpacing: -0.5,
    color: theme.colors.text,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  subtitle: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    fontSize: 10,
    color: theme.colors.textMuted,
    flex: 1,
  },
  trendIcon: {
    marginLeft: 4,
  },
});
