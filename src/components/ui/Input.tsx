import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Theme, useTheme } from '../../providers/ThemeProvider';
import { IoniconName } from '../../utils/icons';

type InputSize = 'sm' | 'md' | 'lg';
type InputVariant = 'default' | 'minimal' | 'filled';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  size?: InputSize;
  variant?: InputVariant;
  leadingIcon?: IoniconName;
  trailingElement?: React.ReactNode;
}

export const Input = React.memo(function Input({
  label,
  error,
  helperText,
  size = 'md',
  variant = 'default',
  leadingIcon,
  trailingElement,
  style,
  placeholderTextColor,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [focused, setFocused] = useState(false);

  const sizeStyles = useMemo(() => {
    switch (size) {
      case 'sm':
        return { height: 40, paddingHorizontal: 12, borderRadius: theme.radius.md, fontSize: 14 };
      case 'lg':
        return { height: 64, paddingHorizontal: 16, borderRadius: theme.radius.lg, fontSize: 18 };
      case 'md':
      default:
        return { height: 56, paddingHorizontal: 16, borderRadius: theme.radius.lg, fontSize: 16 };
    }
  }, [size, theme.radius]);

  const borderColor = useMemo(() => {
    if (error) return colors.danger;
    if (focused) return colors.primary;
    return colors.border;
  }, [error, focused, colors.danger, colors.primary, colors.border]);

  const containerStyle = useMemo(() => {
    const base = {
      borderColor,
      borderWidth: focused ? 1.5 : 1,
    };
    switch (variant) {
      case 'filled':
        return { ...base, backgroundColor: colors.card };
      case 'minimal':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
          borderBottomWidth: focused ? 1.5 : 1,
          borderBottomColor: borderColor,
        };
      case 'default':
      default:
        return { ...base, backgroundColor: colors.card };
    }
  }, [variant, borderColor, focused, colors.card]);

  const handleFocus = useCallback((e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
    setFocused(true);
    onFocus?.(e);
  }, [onFocus]);

  const handleBlur = useCallback((e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
    setFocused(false);
    onBlur?.(e);
  }, [onBlur]);

  const placeholderColor = placeholderTextColor || colors.textMuted;
  const iconSize = size === 'sm' ? 16 : 18;

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      <View style={[
        styles.inputContainer,
        {
          height: sizeStyles.height,
          borderRadius: variant === 'minimal' ? 0 : sizeStyles.borderRadius,
          paddingHorizontal: variant === 'minimal' ? 0 : sizeStyles.paddingHorizontal,
        },
        containerStyle,
      ]}>
        {leadingIcon && (
          <Ionicons
            name={leadingIcon}
            size={iconSize}
            color={focused ? colors.primary : colors.textMuted}
            style={styles.leadingIcon}
          />
        )}
        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
              fontSize: sizeStyles.fontSize,
              paddingVertical: 0,
            },
            leadingIcon && { paddingLeft: 4 },
            variant === 'minimal' && { paddingHorizontal: 0 },
            style,
          ]}
          placeholderTextColor={placeholderColor}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {trailingElement && (
          <View style={styles.trailingElement}>
            {trailingElement}
          </View>
        )}
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
});

const createStyles = (theme: Theme) => StyleSheet.create({
  wrapper: {
    gap: theme.spacing[8],
  },
  label: {
    fontSize: 13,
    color: theme.colors.text,
    fontFamily: theme.fontFamilies.sansSemiBold,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  leadingIcon: {
    marginRight: theme.spacing[8],
  },
  input: {
    flex: 1,
    fontFamily: theme.fontFamilies.sans,
    textAlignVertical: 'center',
  },
  trailingElement: {
    marginLeft: theme.spacing[8],
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 12,
    fontFamily: theme.fontFamilies.sansMedium,
  },
  helperText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontFamily: theme.fontFamilies.sans,
  },
});
