import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {  Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../providers/ThemeProvider';

interface WelcomeStepProps {
  onImportPress?: () => void;
}

export function WelcomeStep({ onImportPress }: WelcomeStepProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper}>
      <View style={styles.badge}>
        <Ionicons name="sparkles-outline" size={16} color={colors.background} />
        <Text style={styles.badgeText}>LOCAL-FIRST MONEY OS</Text>
      </View>

      <Text style={styles.title}>LUNO.</Text>
      <Text style={styles.body}>
        Clean structure, fast capture, and calm control. This setup gives you a complete first account and a clear taxonomy to start with.
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>DEFAULTS</Text>
          <Text style={styles.statValue}>PROFILE + CURRENCY</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>BOOTSTRAP</Text>
          <Text style={styles.statValue}>ACCOUNT + CATEGORIES</Text>
        </View>
      </View>

      {onImportPress && (
        <TouchableOpacity style={styles.importButton} onPress={onImportPress} activeOpacity={0.7}>
          <View style={styles.importIconBox}>
            <Ionicons name="cloud-download-outline" size={18} color={colors.primary} />
          </View>
          <View style={styles.importTextContainer}>
            <Text style={styles.importTitle}>Restore from backup</Text>
            <Text style={styles.importSubtitle}>Import your existing data</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

