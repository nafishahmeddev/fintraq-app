import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePremium } from '@/src/providers/PremiumProvider';
import { Theme, useTheme } from '../../providers/ThemeProvider';

interface PremiumGuardProps {
  children: React.ReactNode;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  containerStyle?: any;
}

/**
 * PremiumGuard - Editorial Brutalist Design
 * 
 * Sizes:
 * - small: 56px min height, 12px padding, 12px radius (md)
 * - medium: 76px min height, 16px padding, 16px radius (lg)
 * - large: 90px min height, 20px padding, 20px radius (xl)
 */
export const PremiumGuard = React.memo(function PremiumGuard({
  children,
  label = 'Pro only',
  size = 'large',
  containerStyle
}: PremiumGuardProps) {
  const { isPremium } = usePremium();
  const theme = useTheme();
  const { colors } = theme;
  const router = useRouter();

  const handlePress = useCallback(() => {
    router.push('/premium');
  }, [router]);

  const config = useMemo(() => {
    const isSmall = size === 'small';
    const isMedium = size === 'medium';
    
    return {
      isSmall,
      padding: isSmall ? theme.spacing[12] : isMedium ? theme.spacing[16] : theme.spacing[20],
      borderRadius: isSmall ? theme.radius.md : isMedium ? theme.radius.lg : theme.radius.xl,
      minHeight: isSmall ? 56 : isMedium ? 76 : 90,
      iconBoxSize: isSmall ? 32 : 44,
      iconBoxRadius: isSmall ? theme.radius.sm : theme.radius.md,
      iconSize: isSmall ? 14 : 18,
      badgePaddingH: isSmall ? 10 : 14,
      badgePaddingV: isSmall ? 6 : 10,
      badgeRadius: isSmall ? theme.radius.sm : theme.radius.md,
      actionTextLabel: isSmall ? 'Pro' : 'Unlock'
    };
  }, [size, theme.spacing, theme.radius]);

  const styles = useMemo(() => createStyles(theme), [theme]);

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={handlePress}
      style={[
        styles.container,
        { 
          backgroundColor: colors.surface, 
          borderColor: colors.border,
          padding: config.padding,
          borderRadius: config.borderRadius,
          minHeight: config.minHeight,
        },
        containerStyle
      ]}
    >
      {/* Background Accent & Watermark */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.primary, opacity: 0.02 }]} />
      <Ionicons
        name="sparkles"
        size={config.isSmall ? 60 : 120}
        color={colors.primary}
        style={[styles.watermark, { opacity: 0.05 }]}
        pointerEvents="none"
      />

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={[
            styles.iconBox,
            { 
              backgroundColor: colors.background, 
              borderColor: colors.border,
              width: config.iconBoxSize,
              height: config.iconBoxSize,
              borderRadius: config.iconBoxRadius,
            },
          ]}>
             <Ionicons name="lock-closed" size={config.iconSize} color={colors.text} />
          </View>

          <View style={styles.textDetails}>
             <Text style={[
               styles.title, 
               { color: colors.text }, 
               config.isSmall && styles.titleSmall
             ]}>
               {label}
             </Text>
             {!config.isSmall && (
               <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                 Premium member exclusive
               </Text>
             )}
          </View>

          <View style={[
            styles.actionBadge,
            { 
              backgroundColor: colors.text,
              paddingHorizontal: config.badgePaddingH,
              paddingVertical: config.badgePaddingV,
              borderRadius: config.badgeRadius,
            },
          ]}>
             <Text style={[styles.actionText, { color: colors.background }]}>
               {config.actionTextLabel}
             </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  watermark: {
    position: 'absolute',
    right: -20,
    bottom: -32,
    transform: [{ rotate: '-15deg' }],
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBox: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  textDetails: {
    flex: 1,
  },
  title: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 14,
    marginBottom: 4,
  },
  titleSmall: {
    fontSize: 11,
    marginBottom: 0,
  },
  subtitle: {
    fontFamily: theme.fontFamilies.sans,
    fontSize: 12,
  },
  actionBadge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontFamily: theme.fontFamilies.sansBold,
    fontSize: 10,
    letterSpacing: 1,
  },
});
