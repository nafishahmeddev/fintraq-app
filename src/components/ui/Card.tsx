import React, { useMemo } from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { Theme, useTheme } from '../../providers/ThemeProvider';

type CardSize = 'sm' | 'md' | 'lg';
type CardVariant = 'default' | 'filled' | 'outlined';

type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  size?: CardSize;
  variant?: CardVariant;
  shadow?: keyof Theme['shadow'];
};

/**
 * Card - Editorial Brutalist Design
 * 
 * Size variants mapped to atomic tokens:
 * - sm: theme.spacing[12] padding, theme.radius.lg (16px)
 * - md: theme.spacing[16] padding, theme.radius.xl (20px) - DEFAULT
 * - lg: theme.spacing[20] padding, theme.radius['2xl'] (24px)
 * 
 * Variants:
 * - default: Subtle card background (semi-transparent)
 * - filled: Solid surface background
 * - outlined: Border only, transparent background
 */
export const Card = React.memo(function Card({
  children,
  style,
  size = 'md',
  variant = 'default',
  shadow: shadowToken,
}: CardProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const sizeStyles = useMemo(() => {
    switch (size) {
      case 'sm':
        return { padding: theme.spacing[12], borderRadius: theme.radius.lg };
      case 'lg':
        return { padding: theme.spacing[20], borderRadius: theme.radius['2xl'] };
      case 'md':
      default:
        return { padding: theme.spacing[16], borderRadius: theme.radius.xl };
    }
  }, [size, theme.spacing, theme.radius]);

  const backgroundStyle = useMemo(() => {
    switch (variant) {
      case 'filled':
        return { backgroundColor: colors.surface };
      case 'outlined':
        return { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border };
      case 'default':
      default:
        return { backgroundColor: colors.card };
    }
  }, [variant, colors.surface, colors.card, colors.border]);

  const shadowStyle = useMemo(() => {
    if (shadowToken) return theme.shadow[shadowToken];
    if (variant === 'default') return theme.shadow.sm;
    return theme.shadow.none;
  }, [shadowToken, variant, theme.shadow]);

  return (
    <View
      style={[
        styles.card,
        sizeStyles,
        backgroundStyle,
        shadowStyle,
        style,
      ]}
    >
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
});

const createStyles = (theme: Theme) => StyleSheet.create({
  card: {
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});
