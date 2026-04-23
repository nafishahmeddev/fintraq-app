import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import { Box } from './Box';
import { cn } from './Text';

export type IconBoxSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type IconBoxShape = 'circle' | 'rounded' | 'square';

export interface IconBoxProps {
  icon: keyof typeof Ionicons.glyphMap;
  size?: IconBoxSize;
  shape?: IconBoxShape;
  backgroundColor?: string;
  iconColor?: string;
  borderColor?: string;
  className?: string;
}

const SIZES = {
  xs: { className: 'w-6 h-6', icon: 12 },
  sm: { className: 'w-8 h-8', icon: 14 },
  md: { className: 'w-10 h-10', icon: 18 },
  lg: { className: 'w-12 h-12', icon: 22 },
  xl: { className: 'w-16 h-16', icon: 28 },
};

const SHAPES = {
  circle: 'rounded-full',
  rounded: 'rounded-xl',
  square: 'rounded-none',
};

export const IconBox = React.memo(function IconBox({
  icon,
  size = 'md',
  shape = 'circle',
  backgroundColor,
  iconColor,
  borderColor,
  className,
}: IconBoxProps) {
  const { isDark } = useTheme();
  const dimensions = SIZES[size];

  return (
    <Box
      className={cn(
        'items-center justify-center border',
        dimensions.className,
        SHAPES[shape],
        className
      )}
      style={{
        backgroundColor: backgroundColor || (isDark ? '#131c13' : '#e9f5ed'), // colors.surface
        borderColor: borderColor || (isDark ? '#1f2b1f' : '#dbead5'), // colors.border
      }}
    >
      <Ionicons
        name={icon}
        size={dimensions.icon}
        color={iconColor || (isDark ? '#fbfff3' : '#000100')} // colors.text
      />
    </Box>
  );
});

export default IconBox;
