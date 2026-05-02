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
  const theme = useTheme();
  const { colors } = theme;
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const dimensions = React.useMemo(() => {
    switch (size) {
      case 'xs': return { container: 24, icon: 12 };
      case 'sm': return { container: 32, icon: 14 };
      case 'lg': return { container: 48, icon: 22 };
      case 'xl': return { container: 64, icon: 28 };
      case 'md':
      default: return { container: 40, icon: 18 };
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
          borderColor: borderColor || colors.border,
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

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
  });

export default IconBox;
