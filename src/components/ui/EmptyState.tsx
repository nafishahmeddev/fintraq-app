import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import { Box, VStack } from './Stack';
import { Pressable } from './Pressable';
import { Text, cn } from './Text';

export type EmptyStateSize = 'sm' | 'md' | 'lg';

export interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  size?: EmptyStateSize;
  className?: string;
}

const SIZES = {
  sm: {
    iconBox: 'w-12 h-12',
    iconSize: 24,
    titleSize: 'text-base',
    subtitleSize: 'text-[13px]',
    paddingVertical: 'py-8',
  },
  md: {
    iconBox: 'w-[68px] h-[68px]',
    iconSize: 32,
    titleSize: 'text-lg',
    subtitleSize: 'text-sm',
    paddingVertical: 'py-12',
  },
  lg: {
    iconBox: 'w-20 h-20',
    iconSize: 40,
    titleSize: 'text-xl',
    subtitleSize: 'text-[15px]',
    paddingVertical: 'py-10',
  },
};

export const EmptyState = React.memo(function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  size = 'md',
  className,
}: EmptyStateProps) {
  const { isDark } = useTheme();
  const dimensions = SIZES[size];

  return (
    <VStack
      className={cn(
        'items-center px-6',
        dimensions.paddingVertical,
        className
      )}
    >
      <Box
        className={cn(
          'bg-surface items-center justify-center rounded-full mb-4',
          dimensions.iconBox
        )}
      >
        <Ionicons
          name={icon}
          size={dimensions.iconSize}
          color={isDark ? '#b2bb8b' : '#737a5f'} // text-muted
        />
      </Box>
      <Text
        className={cn(
          'font-semibold text-center mb-2',
          dimensions.titleSize,
          'text-text'
        )}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          className={cn(
            'font-regular text-center max-w-[280px] leading-5',
            dimensions.subtitleSize,
            'text-text-muted'
          )}
        >
          {subtitle}
        </Text>
      )}
      {actionLabel && onAction && (
        <Pressable
          className="mt-4 py-2 px-4 rounded-full bg-surface border border-border"
          onPress={onAction}
        >
          <Text className="font-semibold text-[13px] text-primary">
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </VStack>
  );
});

export default EmptyState;