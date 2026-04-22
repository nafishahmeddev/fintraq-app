import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { ThemeColors } from '../../theme/colors';
import { radius } from '../../theme/tokens';

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

const SIZES = {
  xs: { container: 24, icon: 12 },
  sm: { container: 32, icon: 14 },
  md: { container: 40, icon: 18 },
  lg: { container: 48, icon: 22 },
  xl: { container: 64, icon: 28 },
};

const SHAPE_RADIUS = {
  circle: radius('full'),
  rounded: radius('md'),
  square: radius('none'),
};

export const IconBox = React.memo(function IconBox({
  icon,
  size = 'md',
  shape = 'circle',
  backgroundColor,
  iconColor,
  borderColor,
  style,
}: IconBoxProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const dimensions = SIZES[size];

  return (
    <View
      style={[
        styles.container,
        {
          width: dimensions.container,
          height: dimensions.container,
          borderRadius: SHAPE_RADIUS[shape],
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
  });

export default IconBox;
