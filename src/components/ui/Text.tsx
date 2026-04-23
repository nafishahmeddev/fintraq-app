import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type TextProps = RNTextProps & {
  className?: string;
};

export function Text({ className, ...props }: TextProps) {
  return (
    <RNText
      className={cn('text-text font-regular', className)}
      {...props}
    />
  );
}
