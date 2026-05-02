import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Theme, useTheme } from '../../../providers/ThemeProvider';
import { useUsageStreak } from '../hooks/useStreak';

/**
 * StreakBadge: A tiny, high-contrast indicator of usage consistency.
 * Sits on the Dashboard to provide dopamine and retention.
 * Re-aligned with core patterns and properly typed.
 */
export function StreakBadge() {
  const theme = useTheme();
  const { colors } = theme;
  const { data: streak, isLoading } = useUsageStreak();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  if (isLoading || !streak || streak === 0) return null;

  return (
    <View style={styles.container}>
      <Ionicons name="flame" size={11} color={colors.primary} />
      <Text style={[styles.text, { color: colors.text }]}>
        {streak}d streak
      </Text>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    height: 24, // Matches accountCurrencyBadge exactly
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 999,
    gap: 4,
    backgroundColor: theme.colors.background + '80', // Translucent dark-mode friendly bg
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: theme.fontFamilies.sansSemiBold, // Matches currency chip
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
