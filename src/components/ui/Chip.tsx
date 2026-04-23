import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import { Pressable } from './Pressable';
import { Text, cn } from './Text';
import { HStack } from './Stack';

export type ChipVariant = 'default' | 'primary' | 'success' | 'danger' | 'warning';
export type ChipSize = 'sm' | 'md' | 'lg';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  variant?: ChipVariant;
  size?: ChipSize;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
}

const SIZES = {
  sm: {
    container: 'h-8 px-3',
    text: 'text-xs',
    iconSize: 14,
  },
  md: {
    container: 'h-9 px-4',
    text: 'text-sm',
    iconSize: 16,
  },
  lg: {
    container: 'h-11 px-5',
    text: 'text-base',
    iconSize: 18,
  },
};

export const Chip = React.memo(function Chip({
  label,
  selected = false,
  onPress,
  variant = 'default',
  size = 'md',
  icon,
  disabled = false,
  className,
  textClassName,
}: ChipProps) {
  const { isDark } = useTheme();
  const dimensions = SIZES[size];

  const getBackgroundColor = () => {
    if (disabled) return 'bg-surface';
    if (!selected) return 'bg-surface';
    
    switch (variant) {
      case 'primary': return 'bg-primary';
      case 'success': return 'bg-success';
      case 'danger': return 'bg-danger';
      case 'warning': return 'bg-warning';
      default: return 'bg-text';
    }
  };

  const getTextColor = () => {
    if (disabled) return 'text-text-muted';
    if (!selected) return 'text-text';
    return isDark ? 'text-background' : 'text-white';
  };

  const getIconColor = () => {
    if (disabled) return isDark ? '#b2bb8b' : '#737a5f'; // text-muted
    if (!selected) return isDark ? '#fbfff3' : '#000100'; // text
    return isDark ? '#000100' : '#FFFFFF'; // background or white
  };

  const getBorderColor = () => {
    if (disabled) return 'border-border';
    if (selected) {
        switch (variant) {
            case 'primary': return 'border-primary';
            case 'success': return 'border-success';
            case 'danger': return 'border-danger';
            case 'warning': return 'border-warning';
            default: return 'border-text';
        }
    }
    return 'border-border';
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      className={cn(
        'flex-row items-center justify-center rounded-full border space-x-1.5',
        dimensions.container,
        getBackgroundColor(),
        getBorderColor(),
        className
      )}
    >
      <HStack className="items-center justify-center">
        {icon && (
          <Ionicons
            name={icon}
            size={dimensions.iconSize}
            color={getIconColor()}
            style={{ marginRight: 4 }}
          />
        )}
        <Text
          className={cn(
            'font-semibold tracking-wide',
            dimensions.text,
            getTextColor(),
            textClassName
          )}
          numberOfLines={1}
        >
          {label}
        </Text>
      </HStack>
    </Pressable>
  );
});

export default Chip;