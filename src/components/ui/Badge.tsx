import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import { Theme, useTheme } from '../../providers/ThemeProvider';

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
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const badgeStyles = useMemo(() => {
    const baseColor = color || (variant === 'default' ? colors.textMuted : colors[variant as keyof typeof colors] || colors.textMuted);
    
    return {
      backgroundColor: (color || baseColor) + '15', // 8% opacity
      borderColor: (color || baseColor) + '30', // 20% opacity
      textColor: color || baseColor,
    };
  }, [variant, color, colors]);

  return (
    <View style={[styles.badge, { backgroundColor: badgeStyles.backgroundColor, borderColor: badgeStyles.borderColor }, style]}>
      <Text style={[styles.text, { color: badgeStyles.textColor }, textStyle]}>
        {label}
      </Text>
    </View>
  );
});

const createStyles = (theme: Theme) => StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 11,
    fontFamily: theme.fontFamilies.sansSemiBold,
    letterSpacing: -0.1,
  },
});
