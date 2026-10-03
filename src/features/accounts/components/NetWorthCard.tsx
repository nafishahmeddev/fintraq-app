import { Badge, Card, Divider, MoneyText, Text } from '@/src/components/ui';
import type { CurrencyNetWorth } from '@/src/features/accounts/utils/net-worth';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type Props = { groups: readonly CurrencyNetWorth[] };

function DonutChart({ accounts, total, size = 44, strokeWidth = 5, emptyColor }: { accounts: any[], total: number, size?: number, strokeWidth?: number, emptyColor: string }) {
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  let currentAngle = 0;
  const positiveAccounts = accounts.filter(a => a.balance > 0);

  return (
    <Svg width={size} height={size}>
      <Circle cx={cx} cy={cy} r={radius} stroke={emptyColor} strokeWidth={strokeWidth} fill="none" />
      
      {total > 0 && positiveAccounts.map(a => {
        const percentage = a.balance / total;
        const strokeLength = percentage * circumference;
        const angle = currentAngle;
        currentAngle += percentage * 360;
        
        const gapSize = positiveAccounts.length > 1 ? strokeWidth + 2 : 0;
        const visibleLength = Math.max(0.1, strokeLength - gapSize);
        
        return (
          <Circle
            key={a.id}
            origin={`${cx}, ${cy}`}
            rotation={angle - 90}
            cx={cx}
            cy={cy}
            r={radius}
            stroke={colorNumberToHex(a.color)}
            strokeWidth={strokeWidth}
            strokeDasharray={`${visibleLength} ${circumference}`}
            strokeDashoffset={-(gapSize / 2)}
            strokeLinecap="round"
            fill="none"
          />
        );
      })}
    </Svg>
  );
}

export const NetWorthCard = React.memo(function NetWorthCard({ groups }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const showCurrency = groups.length > 1;

  return (
    <Card style={styles.card}>
      {groups.map((group, index) => (
        <React.Fragment key={group.currency}>
          {index > 0 ? <Divider /> : null}
          <View style={styles.group}>
            <DonutChart 
              accounts={group.accounts} 
              total={group.assets} 
              size={40} 
              strokeWidth={6} 
              emptyColor={theme.alpha(theme.colors.text, 'faint')} 
            />
            
            <View style={styles.dataCol}>
              <View style={styles.labelRow}>
                <Text variant="caption" tone="muted">{t('accounts.netWorth')}</Text>
                <Text variant="micro" tone="muted">
                  • {group.accounts.length === 1 ? t('transactions.oneAccount') : t('transactions.accountsCount', { count: group.accounts.length })}
                </Text>
              </View>
              <MoneyText
                amount={group.net}
                currency={group.currency}
                weight="bold"
                style={styles.net}
                numberOfLines={1}
                adjustsFontSizeToFit
              />
            </View>

            {showCurrency ? <Badge label={group.currency} variant="muted" /> : null}
          </View>
        </React.Fragment>
      ))}
    </Card>
  );
});

const createStyles = ({ colors, spacing, radius, typography, alpha }: ThemeContextType) =>
  StyleSheet.create({
    card: {
      paddingHorizontal: spacing('4'),
      paddingVertical: 0,
    },
    group: { 
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing('4'), 
      gap: spacing('3'),
    },
    dataCol: {
      flex: 1,
      justifyContent: 'center',
      gap: 2,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1'),
    },
    net: { ...typography.metrics.xl },
  });
