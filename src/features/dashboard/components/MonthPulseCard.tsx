import { Card, MoneyText, Skeleton, Text } from '@/src/components/ui';
import { useMonthTotals } from '@/src/features/dashboard/hooks/dashboard';
import { buildMonthPulse } from '@/src/features/dashboard/utils/widgets';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

type Props = { currency: string };

/**
 * This month at a glance: spend so far against last month, drawn as a bar with a "today" tick so
 * the pace reads without any maths — fill past the tick means spending faster than the month is passing.
 */
export const MonthPulseCard = React.memo(function MonthPulseCard({ currency }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { data: totals, isLoading } = useMonthTotals(currency);

  const pulse = useMemo(() => (totals ? buildMonthPulse(totals, new Date()) : null), [totals]);

  if (isLoading || !pulse) {
    return (
      <View style={[styles.container, styles.margin]}>
        <Skeleton height={136} radius="xl" style={{ flex: 1 }} />
        <Skeleton height={136} radius="xl" style={{ flex: 1 }} />
      </View>
    );
  }

  const share = pulse.shareOfLastMonth;
  // Over last month's total, or ahead of the calendar with a real baseline, is worth a warning colour.
  const barColor = share !== null && share >= 1 ? colors.danger : share !== null && share > pulse.monthProgress ? colors.warning : colors.primary;
  const fill = Math.min(1, share ?? 0);

  return (
    <View style={[styles.container, styles.margin]}>
      {/* Left Column: Spend & Pace */}
      <Card variant="surface" style={styles.card}>
        <View style={styles.header}>
          <Text variant="label" tone="muted">
            {t('dashboard.pulseSpent')}
          </Text>
        </View>

        <View style={styles.amountRow}>
          <MoneyText amount={pulse.expense} currency={currency} weight="bold" style={styles.amount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} />
        </View>

        {share !== null ? (
          <View style={styles.barBlock}>
            <View
              style={styles.track}
              accessibilityRole="progressbar"
              accessibilityLabel={t('dashboard.pulseOfLast', { pct: Math.round(share * 100) })}
              accessibilityValue={{ min: 0, max: 100, now: Math.round(fill * 100) }}
            >
              <View style={[styles.fill, { width: `${fill * 100}%`, backgroundColor: barColor }]} />
              <View style={[styles.todayTick, { left: `${pulse.monthProgress * 100}%` }]} />
            </View>
            <Text variant="caption" tone="muted" numberOfLines={1} adjustsFontSizeToFit>
              {t('dashboard.pulseOfLast', { pct: Math.round(share * 100) })}
            </Text>
          </View>
        ) : pulse.expense === 0 ? (
          <Text variant="caption" tone="muted">
            {t('dashboard.pulseEmpty')}
          </Text>
        ) : null}
      </Card>

      {/* Right Column: Income & Last Month */}
      <Card variant="surface" style={styles.card}>
        <View style={styles.statGroup}>
          <Text variant="micro" tone="muted">
            {t('dashboard.income')}
          </Text>
          <MoneyText amount={pulse.income} currency={currency} type="CR" weight="semibold" style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit />
        </View>
        <View style={styles.divider} />
        <View style={styles.statGroup}>
          <Text variant="micro" tone="muted">
            {t('dashboard.pulseLastMonth')}
          </Text>
          <MoneyText amount={pulse.lastMonthTotal} currency={currency} type="NONE" weight="semibold" style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit />
        </View>
      </Card>
    </View>
  );
});

const TRACK = 6;

const createStyles = ({ colors, spacing, radius, layout, typography, alpha }: ThemeContextType) =>
  StyleSheet.create({
    margin: { marginHorizontal: layout.screenPadding },
    container: { flexDirection: 'row', gap: spacing('3') },
    card: {
      flex: 1,
      gap: spacing('2'),
      justifyContent: 'space-between',
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    amountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing('1') },
    amount: { ...typography.metrics.xl, flexShrink: 1 },
    barBlock: { gap: spacing('2'), marginTop: 'auto' },
    track: {
      height: TRACK,
      borderRadius: radius('full'),
      backgroundColor: alpha(colors.text, 'faint'),
      overflow: 'hidden',
      justifyContent: 'center',
    },
    fill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: radius('full') },
    todayTick: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 2,
      marginLeft: -1,
      backgroundColor: colors.surface,
      borderRadius: radius('full'),
    },
    statGroup: { flex: 1, gap: spacing('0.5'), justifyContent: 'center' },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: alpha(colors.text, 'subtle'), marginVertical: spacing('2') },
    statValue: { ...typography.metrics.lg, flexShrink: 1 },
  });
