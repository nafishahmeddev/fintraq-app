import React, { useMemo } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Theme, useTheme } from '../../providers/ThemeProvider';

type InputSize = 'sm' | 'md' | 'lg';
type InputVariant = 'default' | 'minimal' | 'filled';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  size?: InputSize;
  variant?: InputVariant;
}

/**
 * Input - Editorial Brutalist Design
 * 
 * Size variants mapped to atomic tokens:
 * - sm: 40px height, 12px padding, 12px radius (md)
 * - md: 56px height, 16px padding, 16px radius (lg) - DEFAULT
 * - lg: 64px height, 16px padding, 20px radius (xl)
 */
export const Input = React.memo(function Input({ 
  label, 
  error, 
  size = 'md',
  variant = 'default',
  style,
  placeholderTextColor,
  ...props 
}: InputProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const sizeStyles = useMemo(() => {
    switch (size) {
      case 'sm':
        return { height: 40, paddingHorizontal: 12, borderRadius: theme.radius.md, fontSize: 14 };
      case 'lg':
        return { height: 64, paddingHorizontal: 16, borderRadius: theme.radius.xl, fontSize: 18 };
      case 'md':
      default:
        return { height: 56, paddingHorizontal: 16, borderRadius: theme.radius.lg, fontSize: 16 };
    }
  }, [size, theme.radius]);

  const containerStyle = useMemo(() => {
    switch (variant) {
      case 'filled':
        return { 
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: error ? colors.danger : colors.border,
        };
      case 'minimal':
        return { 
          backgroundColor: 'transparent',
          borderBottomWidth: 1,
          borderBottomColor: error ? colors.danger : colors.border,
        };
      case 'default':
      default:
        return { 
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: error ? colors.danger : colors.border,
        };
    }
  }, [variant, error, colors.surface, colors.border, colors.danger]);

  const placeholderColor = placeholderTextColor || colors.textMuted;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      <View style={[
        styles.inputContainer,
        {
          height: sizeStyles.height,
          paddingHorizontal: variant === 'minimal' ? 0 : sizeStyles.paddingHorizontal,
          borderRadius: variant === 'minimal' ? 0 : sizeStyles.borderRadius,
        },
        containerStyle,
      ]}>
        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
              fontSize: sizeStyles.fontSize,
              paddingVertical: 0,
            },
            variant === 'minimal' && { paddingHorizontal: 0 },
            style,
          ]}
          placeholderTextColor={placeholderColor}
          {...props}
        />
      </View>
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
});

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  label: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: 8,
    fontFamily: theme.fontFamilies.sansSemiBold,
  },
  inputContainer: {
    overflow: 'hidden',
    justifyContent: 'center',
  },
  input: {
    fontFamily: theme.fontFamilies.sans,
    textAlignVertical: 'center',
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 12,
    marginTop: 4,
    fontFamily: theme.fontFamilies.sansMedium,
  },
});
