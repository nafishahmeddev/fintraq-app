import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Theme, useTheme } from '../../providers/ThemeProvider';

export type IconBoxSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type IconBoxShape = 'circle' | 'rounded' | 'square';

export interface IconBoxProps {
  icon: keyof typeof Ionicons.glyphMap;
  size?: IconBoxSize;
  shape?: IconBoxShape;
  backgroundColor?: string;
  iconColor?: string;
  borderColor?: string;
  style?: ViewStyle;
}

export const IconBox = React.memo(function IconBox({
  icon,
  size = 'md',
  shape = 'circle',
  backgroundColor,
  iconColor,
  borderColor,
  style,
}: IconBoxProps) {
  // borderColor only applies when explicitly passed — no default border
  const theme = useTheme();
  const { colors } = theme;
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const dimensions = React.useMemo(() => {
    switch (size) {
      case 'xs': return { container: 28, icon: 14 };
      case 'sm': return { container: 32, icon: 16 };
      case 'lg': return { container: 48, icon: 22 };
      case 'xl': return { container: 56, icon: 26 };
      case 'md':
      default: return { container: 40, icon: 20 };
    }
  }, [size]);

  const borderRadius = React.useMemo(() => {
    switch (shape) {
      case 'circle': return theme.radius.full;
      case 'square': return 0;
      case 'rounded':
      default: return theme.radius.md;
    }
  }, [shape, theme.radius]);

  return (
    <View
      style={[
        styles.container,
        {
          width: dimensions.container,
          height: dimensions.container,
          borderRadius: borderRadius,
          backgroundColor: backgroundColor || colors.surface,
          borderColor: borderColor,
          borderWidth: borderColor ? 1 : 0,
        },
        style,
      ]}
    >
      <Ionicons
        name={icon}
        size={dimensions.icon}
        color={iconColor || colors.text}
      />
    </View>
  );
});

const createStyles = (_theme: Theme) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default IconBox;
