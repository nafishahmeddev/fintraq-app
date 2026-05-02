import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Theme, useTheme } from '../../providers/ThemeProvider';

export interface DividerProps {
  inset?: boolean;
  insetSize?: number;
  color?: string;
  opacity?: number;
  vertical?: boolean;
  style?: ViewStyle;
}

export const Divider = React.memo(function Divider({
  inset = false,
  insetSize = 72,
  color,
  opacity = 0.5,
  vertical = false,
  style,
}: DividerProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  if (vertical) {
    return (
      <View
        style={[
          styles.vertical,
          {
            backgroundColor: color || colors.border,
            opacity,
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.horizontal,
        {
          backgroundColor: color || colors.border,
          opacity,
          marginLeft: inset ? insetSize : 0,
        },
        style,
      ]}
    />
  );
});

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    horizontal: {
      height: 1,
      width: '100%',
    },
    vertical: {
      width: 1,
      height: '100%',
    },
  });

export default Divider;
