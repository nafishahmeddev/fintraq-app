import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { Theme, useTheme } from '../../providers/ThemeProvider';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost' | 'tertiary';
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
  const { colors, fontSizes } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const sizeStyles = useMemo(() => {
    switch (size) {
      case 'sm':
        return { height: 32, paddingHorizontal: 14, fontSize: fontSizes.xs };
      case 'lg':
        return { height: 56, paddingHorizontal: 28, fontSize: fontSizes.md };
      case 'md':
      default:
        return { height: 44, paddingHorizontal: 20, fontSize: fontSizes.sm };
    }
  }, [size, fontSizes]);

  const textColor = useMemo(() => {
    if (disabled) return colors.textMuted;
    switch (variant) {
      case 'primary': return colors.onPrimary;
      case 'danger': return '#FFFFFF';
      case 'success': return colors.onPrimary;
      case 'tertiary': return colors.primary;
      case 'ghost': return colors.text;
      case 'secondary':
      case 'outline':
      default:
        return colors.text;
    }
  }, [variant, disabled, colors]);

  const backgroundColor = useMemo(() => {
    if (disabled) return colors.surface;
    switch (variant) {
      case 'primary': return colors.primary;
      case 'danger': return colors.danger;
      case 'success': return colors.success;
      case 'secondary':
      case 'outline':
      case 'ghost':
      case 'tertiary':
      default:
        return 'transparent';
    }
  }, [variant, disabled, colors]);

  const borderColor = useMemo(() => {
    if (disabled) return colors.border;
    if (variant === 'secondary' || variant === 'outline') return colors.border;
    return 'transparent';
  }, [variant, disabled, colors.border]);

  const shadowStyle = useMemo(() => {
    if (shadowToken) return theme.shadow[shadowToken];
    return theme.shadow.none;
  }, [shadowToken, theme.shadow]);

  const handlePress = useCallback(() => {
    if (!disabled && !isLoading) onPress();
  }, [disabled, isLoading, onPress]);

  return (
    <TouchableOpacity
      style={[
        styles.base,
        {
          height: sizeStyles.height,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          backgroundColor,
          borderColor,
          borderWidth: variant === 'secondary' || variant === 'outline' ? 1.5 : 0,
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
          size={size === 'sm' ? 14 : size === 'lg' ? 22 : 18}
          color={textColor}
          style={{ marginRight: 6 }}
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
            textStyle,
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
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  text: {
    fontFamily: theme.fontFamilies.sansSemiBold,
    letterSpacing: -0.2,
  },
});
