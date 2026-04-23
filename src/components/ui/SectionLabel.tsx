import React from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import { HStack } from './Stack';
import { Text, cn } from './Text';

export type SectionLabelSize = 'sm' | 'md' | 'lg';

export interface SectionLabelProps {
  text: string;
  size?: SectionLabelSize;
  uppercase?: boolean;
  className?: string;
  rightElement?: React.ReactNode;
}

const SIZES = {
  sm: 'text-[9px] tracking-widest',
  md: 'text-[10px] tracking-widest',
  lg: 'text-[11px] tracking-widest',
};

export const SectionLabel = React.memo(function SectionLabel({
  text,
  size = 'md',
  uppercase = true,
  className,
  rightElement,
}: SectionLabelProps) {
  const dimensions = SIZES[size];

  return (
    <HStack className={cn('items-center justify-between', className)}>
      <Text
        className={cn(
          'font-semibold text-text-muted',
          dimensions,
          uppercase && 'uppercase'
        )}
      >
        {text}
      </Text>
      {rightElement}
    </HStack>
  );
});

export default SectionLabel;