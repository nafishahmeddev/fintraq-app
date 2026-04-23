import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { ThemeColors } from '../../theme/colors';
import { RADIUS, spacing } from '../../theme/tokens';
import { TYPOGRAPHY } from '../../theme/typography';

type BadgeVariant = 'default' | 'primary' | 'success' | 'danger' | 'warning' | 'info';

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  color?: string; // Custom color override
  style?: ViewStyle;
  textStyle?: TextStyle;
};

/**
 * Badge - Small label for categories and status.
 * Strictly follows the Editorial Brutalist design language.
 */
export const Badge = React.memo(function Badge({
  label,
  variant = 'default',
  color,
  style,
  textStyle,
}: BadgeProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const badgeStyle = useMemo(() => {
    const baseColor = color || (variant === 'default' ? colors.textMuted : colors[variant as keyof ThemeColors]);
    
    return {
      backgroundColor: (color || baseColor) + '15', // 8% opacity
      borderColor: (color || baseColor) + '30', // 20% opacity
    };
  }, [variant, color, colors]);

  const textColor = useMemo(() => {
    if (color) return color;
    switch (variant) {
      case 'default': return colors.textMuted;
      case 'primary': return colors.primary;
      case 'success': return colors.success;
      case 'danger': return colors.danger;
      case 'warning': return colors.warning;
      case 'info': return colors.info;
      default: return colors.text;
    }
  }, [variant, color, colors]);

  return (
    <View style={[styles.badge, badgeStyle, style]}>
      <Text style={[styles.text, { color: textColor }, textStyle]}>
        {label}
      </Text>
    </View>
  );
});

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  badge: {
    paddingHorizontal: spacing('2'),
    paddingVertical: spacing('0.5'),
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontFamily: TYPOGRAPHY.fonts.medium,
    fontWeight: TYPOGRAPHY.weights.medium,
    letterSpacing: -0.2,
  },
});
