import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme, useTheme } from '../../../providers/ThemeProvider';

interface WelcomeStepProps {
  onImportPress?: () => void;
}

export function WelcomeStep({ onImportPress }: WelcomeStepProps) {
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.badge}>
        <Ionicons name="sparkles-outline" size={14} color={theme.colors.primaryDark} />
        <Text style={styles.badgeText}>Local-first money OS</Text>
      </View>

      <Text style={styles.title}>LUNO.</Text>
      <Text style={styles.body}>
        Clean structure, fast capture, and calm control. This setup gives you a complete first account and a clear taxonomy to start with.
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Defaults</Text>
          <Text style={styles.statValue}>Profile + Currency</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Bootstrap</Text>
          <Text style={styles.statValue}>Account + Categories</Text>
        </View>
      </View>

      {onImportPress && (
        <TouchableOpacity style={styles.importButton} onPress={onImportPress} activeOpacity={0.7}>
          <View style={styles.importIconBox}>
            <Ionicons name="cloud-download-outline" size={18} color={theme.colors.primary} />
          </View>
          <View style={styles.importTextContainer}>
            <Text style={styles.importTitle}>Restore from backup</Text>
            <Text style={styles.importSubtitle}>Import your existing data</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    wrapper: {
      flex: 1,
      justifyContent: 'space-between',
      minHeight: 360,
    },
    badge: {
      alignSelf: 'flex-start',
      height: 30,
      borderRadius: theme.radius.full,
      paddingHorizontal: theme.spacing[12],
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[8],
    },
    badgeText: {
      fontFamily: theme.fontFamilies.sansBold,
      fontSize: 10,
      color: theme.colors.primaryDark,
      letterSpacing: 0.8,
    },
    title: {
      marginTop: theme.spacing[20],
      fontFamily: theme.fontFamilies.heading,
      fontSize: 52,
      lineHeight: 54,
      color: theme.colors.text,
      letterSpacing: theme.letterSpacing.tight,
    },
    body: {
      marginTop: theme.spacing[12],
      fontFamily: theme.fontFamilies.sans,
      fontSize: theme.fontSizes.md,
      lineHeight: 24,
      color: theme.colors.textMuted,
      maxWidth: 320,
    },
    statsRow: {
      flexDirection: 'row',
      gap: theme.spacing[12],
      marginTop: theme.spacing[24],
    },
    statCard: {
      flex: 1,
      paddingVertical: theme.spacing[4],
    },
    statLabel: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: 10,
      color: theme.colors.textMuted,
      letterSpacing: 1.1,
      marginBottom: theme.spacing[8],
    },
    statValue: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: theme.fontSizes.sm,
      color: theme.colors.text,
      lineHeight: 18,
    },
    importButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing[24],
      padding: theme.spacing[16],
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadow.xs,
    },
    importIconBox: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing[12],
    },
    importTextContainer: {
      flex: 1,
    },
    importTitle: {
      fontFamily: theme.fontFamilies.sansSemiBold,
      fontSize: theme.fontSizes.md,
      color: theme.colors.text,
      marginBottom: 2,
    },
    importSubtitle: {
      fontFamily: theme.fontFamilies.sans,
      fontSize: theme.fontSizes.sm,
      color: theme.colors.textMuted,
    },
  });
