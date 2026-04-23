import { View, ViewProps } from 'react-native';
import { cn } from './Text';

export function Spacer({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn('flex-1', className)} {...props} />;
}
