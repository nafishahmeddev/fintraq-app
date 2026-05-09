import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Theme, useTheme } from '../../providers/ThemeProvider';

export interface DividerProps {
  inset?: boolean;
  insetSize?: number;
  color?: string;
  opacity?: number;
  vertical?: boolean;
  label?: string;
  style?: ViewStyle;
}

export const Divider = React.memo(function Divider({
  inset = false,
  insetSize = 72,
  color,
  opacity = 0.6,
  vertical = false,
  label,
  style,
}: DividerProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const lineColor = color || colors.border;

  if (vertical) {
    return (
      <View
        style={[
          styles.vertical,
          { backgroundColor: lineColor, opacity },
          style,
        ]}
      />
    );
  }

  if (label) {
    return (
      <View style={[styles.labelRow, style]}>
        <View style={[styles.horizontal, { backgroundColor: lineColor, opacity, flex: 1 }]} />
        <Text style={styles.labelText}>{label}</Text>
        <View style={[styles.horizontal, { backgroundColor: lineColor, opacity, flex: 1 }]} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.horizontal,
        {
          backgroundColor: lineColor,
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
      height: StyleSheet.hairlineWidth,
      width: '100%',
    },
    vertical: {
      width: StyleSheet.hairlineWidth,
      height: '100%',
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[12],
    },
    labelText: {
      fontSize: 11,
      fontFamily: theme.fontFamilies.sansMedium,
      color: theme.colors.textMuted,
    },
  });

export default Divider;
