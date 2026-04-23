import { View, ViewProps } from 'react-native';
import { cn } from './Text';

export function Divider({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn('h-px bg-border my-2', className)} {...props} />;
}
