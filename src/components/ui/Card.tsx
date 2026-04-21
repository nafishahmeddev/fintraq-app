import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { ThemeColors } from '../../theme/colors';
import { COMPONENT_SIZES, shadow, ShadowToken } from '../../theme/tokens';

type CardSize = 'sm' | 'md' | 'lg';
type CardVariant = 'default' | 'filled' | 'outlined';

type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  size?: CardSize;
  variant?: CardVariant;
  shadow?: ShadowToken;
};

/**
 * Card - Editorial Brutalist Design
 * 
 * Size variants (padding + radius):
 * - sm: 12px padding, 16px radius (lg)
 * - md: 16px padding, 20px radius (xl) - DEFAULT
 * - lg: 20px padding, 24px radius (2xl)
 * 
 * Variants:
 * - default: Solid card background
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const sizeConfig = COMPONENT_SIZES.card[size];

  const backgroundStyle = useMemo(() => {
    switch (variant) {
      case 'filled':
        return { backgroundColor: colors.surface };
      case 'outlined':
        return { backgroundColor: 'transparent' };
      case 'default':
      default:
        return { backgroundColor: colors.card };
    }
  }, [variant, colors.surface, colors.card, colors.border]);

  const shadowStyle = useMemo(() => {
    if (shadowToken) return shadow(shadowToken);
    if (variant === 'default') return shadow('sm');
    return shadow('none');
  }, [shadowToken, variant]);

  return (
    <View
      style={[
        styles.card,
        {
          padding: sizeConfig.padding,
          borderRadius: sizeConfig.borderRadius,
        },
        backgroundStyle,
        shadowStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
});

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});
