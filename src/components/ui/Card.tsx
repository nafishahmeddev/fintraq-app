import React from 'react';
import { Box } from './Box';
import { cn } from './Text';

type CardSize = 'sm' | 'md' | 'lg';
type CardVariant = 'default' | 'filled' | 'outlined';

type CardProps = {
  children: React.ReactNode;
  className?: string;
  size?: CardSize;
  variant?: CardVariant;
};

export const Card = React.memo(function Card({ 
  children, 
  className,
  size = 'md',
  variant = 'default',
}: CardProps) {
  const sizeClasses = {
    sm: 'p-3 rounded-xl',
    md: 'p-4 rounded-2xl',
    lg: 'p-5 rounded-3xl',
  };

  const variantClasses = {
    default: 'bg-card',
    filled: 'bg-surface',
    outlined: 'bg-transparent border border-border',
  };

  return (
    <Box
      className={cn(
        'overflow-hidden relative',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      <Box className="relative z-10">
        {children}
      </Box>
    </Box>
  );
});
