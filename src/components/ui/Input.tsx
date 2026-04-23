import React from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { Box } from './Box';
import { Text, cn } from './Text';

type InputSize = 'sm' | 'md' | 'lg';
type InputVariant = 'default' | 'minimal' | 'filled';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  size?: InputSize;
  variant?: InputVariant;
  className?: string;
  inputClassName?: string;
}

export const Input = React.memo(function Input({ 
  label, 
  error, 
  size = 'md',
  variant = 'default',
  className,
  inputClassName,
  placeholderTextColor,
  ...props 
}: InputProps) {
  const { isDark } = useTheme();

  const sizeClasses = {
    sm: 'h-10 px-3 rounded-xl',
    md: 'h-14 px-4 rounded-2xl',
    lg: 'h-16 px-4 rounded-3xl',
  };

  const textClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const variantClasses = {
    default: 'bg-surface border border-border',
    minimal: 'bg-transparent border-b border-border', // overrides height/px/rounded below
    filled: 'bg-surface border-0',
  };

  const errorClasses = {
    default: 'border-danger',
    minimal: 'border-danger',
    filled: 'border border-danger',
  };

  const containerClasses = cn(
    variant !== 'minimal' && sizeClasses[size],
    variant === 'minimal' && 'h-auto py-2 rounded-none px-0',
    variantClasses[variant],
    error && errorClasses[variant]
  );

  const placeholderColor = placeholderTextColor || (isDark ? '#b2bb8b80' : '#737a5f80');

  return (
    <Box className={cn("mb-4", className)}>
      {label && (
        <Text className="text-sm text-text-muted mb-2 font-medium">
          {label}
        </Text>
      )}
      <Box className={cn("overflow-hidden justify-center", containerClasses)}>
        <TextInput
          className={cn(
            "font-regular text-text p-0",
            textClasses[size],
            inputClassName
          )}
          placeholderTextColor={placeholderColor}
          {...props}
        />
      </Box>
      {error && (
        <Text className="text-danger text-xs mt-1 font-medium">
          {error}
        </Text>
      )}
    </Box>
  );
});