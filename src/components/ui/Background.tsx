import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

type CircleConfig = {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  width: number;
  height: number;
  color: string;
};

type BackgroundProps = {
  circles?: CircleConfig[];
};

export function Background({ circles }: BackgroundProps) {
  const { colors } = useTheme();

  const defaultCircles: CircleConfig[] = React.useMemo(
    () => [
      { top: -100, left: -80, width: 360, height: 360, color: colors.primary + '20' },
      { top: 220, right: -140, width: 460, height: 460, color: colors.primary + '15' },
    ],
    [colors.primary],
  );

  const resolvedCircles = circles ?? defaultCircles;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {resolvedCircles.map((circle, index) => (
        <View
          key={index}
          style={[
            styles.circle,
            {
              top: circle.top,
              bottom: circle.bottom,
              left: circle.left,
              right: circle.right,
              width: circle.width,
              height: circle.height,
              backgroundColor: circle.color,
            },
          ]}
        />
      ))}
      {Platform.OS === 'android' && (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.background }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    position: 'absolute',
    borderRadius: 999,
  },
});
