import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { ThemeColors } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { spacing, radius, LAYOUT } from '../../theme/tokens';

type EmptyStateSize = 'compact' | 'default' | 'large';
type EmptyStateVariant = 'card' | 'page' | 'inline';

type EmptyStateProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  size?: EmptyStateSize;
  variant?: EmptyStateVariant;
  style?: ViewStyle;
  fullHeight?: boolean;
};

/**
 * EmptyState - Editorial Brutalist Design
 * 
 * A polished empty state component for when there's no data to display.
 * Provides helpful context and optional actions to guide users.
 * 
 * Sizes:
 * - compact: Minimal padding, smaller text (for cards/inline)
 * - default: Standard padding and sizing (most common)
 * - large: Full padding, larger text (for dedicated empty screens)
 * 
 * Variants:
 * - card: Inside a card with subtle background
 * - page: Full page empty state (centered)
 * - inline: Inline with content flow
 * 
 * Example usage:
 * ```tsx
 * <EmptyState
 *   icon="receipt-outline"
 *   title="No transactions yet"
 *   description="Start tracking your spending by adding your first transaction."
 *   actionLabel="Add Transaction"
 *   onAction={() => router.push('/transactions/create')}
 * />
 * ```
 */
export const EmptyState = React.memo(function EmptyState({
  icon,
  iconSize,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  size = 'default',
  variant = 'page',
  style,
  fullHeight = true,
}: EmptyStateProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors, size, variant), [colors, size, variant]);

  const handleAction = useCallback(() => {
    onAction?.();
  }, [onAction]);

  const handleSecondaryAction = useCallback(() => {
    onSecondaryAction?.();
  }, [onSecondaryAction]);

  const iconBoxSize = useMemo(() => {
    switch (size) {
      case 'compact': return 40;
      case 'large': return 72;
      default: return 56;
    }
  }, [size]);

  const defaultIconSize = useMemo(() => {
    switch (size) {
      case 'compact': return 20;
      case 'large': return 32;
      default: return 24;
    }
  }, [size]);

  return (
    <View style={[styles.container, fullHeight && styles.fullHeight, style]}>
      <View style={styles.content}>
        {icon && (
          <View style={[styles.iconBox, { width: iconBoxSize, height: iconBoxSize, borderRadius: radius('md') }]}>
            <Ionicons
              name={icon}
              size={iconSize || defaultIconSize}
              color={colors.primary}
            />
          </View>
        )}

        <Text style={styles.title}>{title}</Text>

        {description && (
          <Text style={styles.description}>{description}</Text>
        )}

        {(actionLabel || secondaryActionLabel) && (
          <View style={styles.actions}>
            {actionLabel && onAction && (
              <TouchableOpacity
                style={styles.primaryAction}
                onPress={handleAction}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryActionText}>{actionLabel}</Text>
              </TouchableOpacity>
            )}

            {secondaryActionLabel && onSecondaryAction && (
              <TouchableOpacity
                style={styles.secondaryAction}
                onPress={handleSecondaryAction}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryActionText}>{secondaryActionLabel}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
});

const createStyles = (colors: ThemeColors, size: EmptyStateSize, variant: EmptyStateVariant) => {
  // Size-based configurations
  const sizeConfig = {
    compact: {
      padding: spacing('4'),
      titleSize: TYPOGRAPHY.sizes.md,
      descSize: TYPOGRAPHY.sizes.sm,
      gap: spacing('2'),
    },
    default: {
      padding: spacing('6'),
      titleSize: TYPOGRAPHY.sizes.xl,
      descSize: TYPOGRAPHY.sizes.md,
      gap: spacing('3'),
    },
    large: {
      padding: spacing('8'),
      titleSize: TYPOGRAPHY.sizes.xxl,
      descSize: TYPOGRAPHY.sizes.lg,
      gap: spacing('4'),
    },
  }[size];

  // Variant-based configurations
  const variantConfig = {
    card: {
      alignItems: 'center' as const,
      textAlign: 'center' as const,
      maxWidth: LAYOUT.maxContentWidth,
    },
    page: {
      alignItems: 'center' as const,
      textAlign: 'center' as const,
      maxWidth: 320,
    },
    inline: {
      alignItems: 'flex-start' as const,
      textAlign: 'left' as const,
      maxWidth: LAYOUT.maxContentWidth,
    },
  }[variant];

  return StyleSheet.create({
    container: {
      padding: sizeConfig.padding,
      alignItems: variantConfig.alignItems,
      justifyContent: 'center',
    },
    fullHeight: {
      flex: 1,
      minHeight: 200,
    },
    content: {
      alignItems: variantConfig.alignItems,
      maxWidth: variantConfig.maxWidth,
    },
    iconBox: {
      backgroundColor: colors.primary + '12',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: sizeConfig.gap,
    },
    title: {
      fontFamily: TYPOGRAPHY.fonts.heading,
      fontSize: sizeConfig.titleSize,
      color: colors.text,
      textAlign: variantConfig.textAlign,
      letterSpacing: -0.5,
      marginBottom: size === 'compact' ? spacing('1') : spacing('2'),
    },
    description: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: sizeConfig.descSize,
      color: colors.textMuted,
      textAlign: variantConfig.textAlign,
      lineHeight: sizeConfig.descSize * 1.5,
      marginBottom: size === 'compact' ? spacing('3') : spacing('4'),
    },
    actions: {
      flexDirection: variant === 'inline' ? 'row' : 'column',
      gap: spacing('2'),
      alignItems: variantConfig.alignItems,
    },
    primaryAction: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing('5'),
      paddingVertical: spacing('2.5'),
      borderRadius: radius('lg'),
      minHeight: LAYOUT.minTouchTarget,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryActionText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: TYPOGRAPHY.sizes.md,
      color: '#FFFFFF',
    },
    secondaryAction: {
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('2'),
      minHeight: LAYOUT.minTouchTarget,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryActionText: {
      fontFamily: TYPOGRAPHY.fonts.medium,
      fontSize: TYPOGRAPHY.sizes.md,
      color: colors.primary,
    },
  });
};
