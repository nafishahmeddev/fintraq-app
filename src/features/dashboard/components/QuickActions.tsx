import * as Haptics from 'expo-haptics';
import { Href, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { BentoPressable, Icon, Text } from '@/src/components/ui';
import type {  IconName  } from '@/src/components/ui';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type Action = { key: string; label: string; icon: IconName; href: Href };

type Props = {
  /** Transfers need two accounts; the button is hidden until there are. */
  canTransfer: boolean;
};

/**
 * One-tap entry points for the most common writes, each opening its form already set up. Drawn as
 * soft tiles on the ink hero: lime icons, white labels.
 */
export const QuickActions = React.memo(function QuickActions({ canTransfer }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const actions = useMemo((): Action[] => {
    const all: (Action | null)[] = [
      { key: 'expense', label: t('dashboard.quickExpense'), icon: 'ArrowUpRightIcon', href: '/transactions/create?type=DR' },
      { key: 'income', label: t('dashboard.quickIncome'), icon: 'ArrowDownLeftIcon', href: '/transactions/create?type=CR' },
      canTransfer ? { key: 'transfer', label: t('dashboard.quickTransfer'), icon: 'ArrowsLeftRightIcon', href: '/transactions/create?type=TR' } : null,
      { key: 'loan', label: t('dashboard.quickLoan'), icon: 'BriefcaseIcon', href: '/(main)/loans/form' },
    ];
    return all.filter((a): a is Action => a !== null);
  }, [t, canTransfer]);

  return (
    <View style={styles.row} accessibilityRole="toolbar" accessibilityLabel={t('dashboard.quickActions')}>
      {actions.map((action) => (
        <BentoPressable
          key={action.key}
          style={styles.action}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            router.push(action.href);
          }}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <Icon name={action.icon} size={20} color={colors.onInk} weight="bold" />
          <Text variant="caption" color={colors.onInk} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {action.label}
          </Text>
        </BentoPressable>
      ))}
    </View>
  );
});

const createStyles = ({ colors, spacing, radius, alpha }: ThemeContextType) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: spacing('1.5') },
    action: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing('1'),
      paddingVertical: spacing('2'),
      paddingHorizontal: spacing('0.5'),
      borderRadius: radius('lg'),
      backgroundColor: alpha(colors.onInk, 'subtle'),
    },
  });
