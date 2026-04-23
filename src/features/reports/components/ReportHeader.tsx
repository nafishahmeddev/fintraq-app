import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {  Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../providers/ThemeProvider';

interface ReportHeaderProps {
  title: string;
  subtitle: string;
}

/**
 * ReportHeader: Editorial-style header for reports with a back button.
 * Aligns with the journalistic aesthetic.
 */
export function ReportHeader({ title, subtitle }: ReportHeaderProps) {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={() => router.back()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={20} color={colors.text} />
      </TouchableOpacity>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
      </View>
    </View>
  );
}

