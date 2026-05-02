import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { Theme, useTheme } from '../../providers/ThemeProvider';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  shadow?: keyof Theme['shadow'];
  icon?: keyof typeof Ionicons.glyphMap;
};

/**
 * Button - Editorial Brutalist Design
 * 
 * Size variants mapped to atomic tokens:
 * - sm: 36px height, 12px radius (md), 13px font
 * - md: 48px height, 16px radius (lg), 16px font - DEFAULT
 * - lg: 56px height, 20px radius (xl), 18px font
 */
export const Button = React.memo(function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  shadow: shadowToken,
  icon,
}: ButtonProps) {
  const theme = useTheme();
  const { colors, fontFamilies, fontSizes } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const sizeStyles = useMemo(() => {
    switch (size) {
      case 'sm':
        return { height: 36, paddingHorizontal: 12, borderRadius: theme.radius.md, fontSize: fontSizes.sm };
      case 'lg':
        return { height: 56, paddingHorizontal: 24, borderRadius: theme.radius.xl, fontSize: fontSizes.lg };
      case 'md':
      default:
        return { height: 48, paddingHorizontal: 16, borderRadius: theme.radius.lg, fontSize: fontSizes.md };
    }
  }, [size, theme.radius, fontSizes]);

  const textColor = useMemo(() => {
    if (disabled) return colors.textMuted;
    if (variant === 'secondary' || variant === 'outline' || variant === 'ghost') return colors.text;
    return colors.background;
  }, [variant, disabled, colors.text, colors.textMuted, colors.background]);

  const backgroundColor = useMemo(() => {
    if (disabled) return colors.surface;
    switch (variant) {
      case 'primary': return colors.primary;
      case 'danger': return colors.danger;
      case 'success': return colors.success;
      case 'secondary':
      case 'outline':
      case 'ghost':
      default:
        return 'transparent';
    }
  }, [variant, disabled, colors.primary, colors.danger, colors.success, colors.surface]);

  const borderColor = useMemo(() => {
    if (disabled) return colors.border;
    if (variant === 'secondary' || variant === 'outline') return colors.border;
    return 'transparent';
  }, [variant, disabled, colors.border]);

  const shadowStyle = useMemo(() => {
    if (shadowToken) return theme.shadow[shadowToken];
    if (variant === 'primary' && !disabled) return theme.shadow.sm;
    return theme.shadow.none;
  }, [shadowToken, variant, disabled, theme.shadow]);

  const handlePress = useCallback(() => {
    if (!disabled && !isLoading) {
      onPress();
    }
  }, [disabled, isLoading, onPress]);

  return (
    <TouchableOpacity
      style={[
        styles.base,
        {
          height: sizeStyles.height,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          borderRadius: sizeStyles.borderRadius,
          backgroundColor,
          borderColor,
          borderWidth: variant === 'secondary' || variant === 'outline' ? 1 : 0,
          opacity: disabled ? 0.5 : 1,
        },
        shadowStyle,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || isLoading}
      activeOpacity={0.75}
    >

      {icon && !isLoading && (
        <Ionicons
          name={icon}
          size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20}
          color={textColor}
          style={{ marginRight: 8 }}
        />
      )}

      {isLoading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            {
              color: textColor,
              fontSize: sizeStyles.fontSize,
            },
            textStyle
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
});

const createStyles = (theme: Theme) => StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  text: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    letterSpacing: -0.2,
  },
});
