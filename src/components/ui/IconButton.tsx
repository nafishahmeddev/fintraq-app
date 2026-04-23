import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import { Pressable } from './Pressable';
import { Box } from './Box';
import { cn } from './Text';

export type IconButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'ghost';
  disabled?: boolean;
  className?: string;
  badge?: boolean;
};

const SIZES = {
  sm: { className: 'w-8 h-8', icon: 16 },
  md: { className: 'w-9 h-9', icon: 18 },
  lg: { className: 'w-11 h-11', icon: 20 },
};

export const IconButton = React.memo(function IconButton({
  icon,
  onPress,
  size = 'md',
  variant = 'default',
  disabled = false,
  className,
  badge = false,
}: IconButtonProps) {
  const { isDark } = useTheme();
  const dimensions = SIZES[size];

  const variantClasses = {
    default: 'bg-surface',
    primary: 'bg-text',
    ghost: 'bg-transparent border-transparent',
  };

  const getIconColor = () => {
    switch (variant) {
      case 'primary':
        return isDark ? '#000100' : '#F6FFF9'; // background
      case 'ghost':
        return isDark ? '#fbfff3' : '#000100'; // text
      default:
        return isDark ? '#fbfff3' : '#000100'; // text
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={cn(
        'rounded-full justify-center items-center border border-border relative',
        dimensions.className,
        variantClasses[variant],
        disabled && 'opacity-50',
        className
      )}
    >
      <Ionicons name={icon} size={dimensions.icon} color={getIconColor()} />
      {badge && (
        <Box className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
      )}
    </Pressable>
  );
});