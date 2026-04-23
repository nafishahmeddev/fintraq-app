import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ActivityIndicator } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { Pressable } from './Pressable';
import { HStack } from './Stack';
import { Text, cn } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export const Button = React.memo(function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className,
  textClassName,
  icon,
}: ButtonProps) {
  const { isDark } = useTheme();

  const sizeClasses = {
    sm: 'h-9 px-3 rounded-full',
    md: 'h-12 px-4 rounded-full',
    lg: 'h-14 px-5 rounded-full',
  };

  const textClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-base',
  };

  const variantClasses = {
    primary: 'bg-primary border-transparent',
    secondary: 'bg-transparent border-border border',
    outline: 'bg-transparent border-border border',
    danger: 'bg-danger border-transparent',
    success: 'bg-success border-transparent',
    ghost: 'bg-transparent border-transparent',
  };

  const textVariantClasses = {
    primary: 'text-white',
    secondary: 'text-text',
    outline: 'text-text',
    danger: 'text-white',
    success: 'text-white',
    ghost: 'text-text',
  };

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;

  // Calculate raw color for icon since it needs a string
  const iconColor = useMemo(() => {
    if (disabled) return isDark ? '#b2bb8b' : '#737a5f';
    if (variant === 'secondary' || variant === 'outline' || variant === 'ghost') return isDark ? '#fbfff3' : '#000100';
    return '#FFFFFF';
  }, [variant, disabled, isDark]);

  return (
    <Pressable
      className={cn(
        'justify-center items-center flex-row overflow-hidden',
        sizeClasses[size],
        variantClasses[variant],
        disabled ? 'opacity-50' : 'opacity-100',
        className
      )}
      onPress={onPress}
      disabled={disabled || isLoading}
    >
      <HStack className="items-center justify-center space-x-2">
        {icon && !isLoading && (
          <Ionicons
            name={icon}
            size={iconSize}
            color={iconColor}
          />
        )}

        {isLoading ? (
          <ActivityIndicator color={iconColor} size="small" />
        ) : (
          <Text
            className={cn(
              'font-semibold tracking-tight',
              textClasses[size],
              textVariantClasses[variant],
              disabled ? 'text-text-muted' : '',
              textClassName
            )}
          >
            {title}
          </Text>
        )}
      </HStack>
    </Pressable>
  );
});
