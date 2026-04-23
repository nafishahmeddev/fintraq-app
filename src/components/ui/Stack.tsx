import { View, ViewProps } from 'react-native';
import { cn } from './Text';

type StackProps = ViewProps & {
  className?: string;
};

export function VStack({ className, ...props }: StackProps) {
  return <View className={cn('flex-col', className)} {...props} />;
}

export function HStack({ className, ...props }: StackProps) {
  return <View className={cn('flex-row', className)} {...props} />;
}
