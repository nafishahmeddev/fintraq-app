import { Pressable as RNPressable, PressableProps as RNPressableProps } from 'react-native';

export function Pressable(props: RNPressableProps) {
  return <RNPressable {...props} />;
}
