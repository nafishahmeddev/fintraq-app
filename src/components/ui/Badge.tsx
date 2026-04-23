import React from 'react';
import { Box } from './Box';
import { Text, cn } from './Text';

type BadgeVariant = 'default' | 'primary' | 'success' | 'danger' | 'warning' | 'info';

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  className?: string;
  textClassName?: string;
};

export const Badge = React.memo(function Badge({
  label,
  variant = 'default',
  className,
  textClassName,
}: BadgeProps) {

  const variantClasses = {
    default: 'bg-text-muted/10 border-text-muted/20',
    primary: 'bg-primary/10 border-primary/20',
    success: 'bg-success/10 border-success/20',
    danger: 'bg-danger/10 border-danger/20',
    warning: 'bg-warning/10 border-warning/20',
    info: 'bg-info/10 border-info/20',
  };

  const textVariantClasses = {
    default: 'text-text-muted',
    primary: 'text-primary',
    success: 'text-success',
    danger: 'text-danger',
    warning: 'text-warning',
    info: 'text-info',
  };

  return (
    <Box className={cn(
      'px-2 py-0.5 rounded-sm border self-start justify-center items-center',
      variantClasses[variant],
      className
    )}>
      <Text className={cn(
        'text-xs font-medium tracking-tight',
        textVariantClasses[variant],
        textClassName
      )}>
        {label}
      </Text>
    </Box>
  );
});
