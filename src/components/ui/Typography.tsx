import React from 'react';
import { TextProps as RNTextProps } from 'react-native';
import { Text, cn } from './Text';

type TypographyVariant = 
  | 'h1' 
  | 'h2' 
  | 'h3' 
  | 'body' 
  | 'bodySm' 
  | 'label' 
  | 'mono' 
  | 'monoSm';

type TypographyProps = RNTextProps & {
  variant?: TypographyVariant;
  className?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
};

export const Typography = React.memo(function Typography({
  variant = 'body',
  className,
  align,
  children,
  ...props
}: TypographyProps) {

  const variantClasses = {
    h1: 'text-3xl font-heading leading-tight tracking-tight',
    h2: 'text-2xl font-semibold leading-snug tracking-tight',
    h3: 'text-xl font-semibold leading-snug tracking-tight',
    body: 'text-base font-regular leading-normal',
    bodySm: 'text-sm font-regular leading-normal',
    label: 'text-xs font-medium text-text-muted uppercase tracking-wide',
    mono: 'text-base font-monoRegular',
    monoSm: 'text-sm font-monoRegular',
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify',
  };

  return (
    <Text 
      className={cn(
        variantClasses[variant],
        align && alignClasses[align],
        className
      )}
      {...props}
    >
      {children}
    </Text>
  );
});
