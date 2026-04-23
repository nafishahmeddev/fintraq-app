import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {  Text, View } from 'react-native';
import { useTheme } from '../../../providers/ThemeProvider';
import { useUsageStreak } from '../hooks/useStreak';

/**
 * StreakBadge: A tiny, high-contrast indicator of usage consistency.
 * Sits on the Dashboard to provide dopamine and retention.
 * Re-aligned with core patterns and properly typed.
 */
export function StreakBadge() {
  const { colors } = useTheme();
  const { data: streak, isLoading } = useUsageStreak();

  if (isLoading || !streak || streak === 0) return null;

  return (
    <View style={styles.container}>
      <Ionicons name="flame" size={11} color={colors.primary} />
      <Text style={[styles.text, { color: colors.text }]}>
        {streak}D STREAK
      </Text>
    </View>
  );
}

