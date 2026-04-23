import { BlurView } from '@sbaiahmed1/react-native-blur';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { Box } from './Stack';

export type BlurCircle = {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  width: number;
  height: number;
  color: string;
};

type BlurBackgroundProps = {
  circles?: BlurCircle[];
  blurAmount?: number;
  androidOverlayOpacity?: string;
};

export function BlurBackground({
  circles,
  blurAmount,
  androidOverlayOpacity = '60',
}: BlurBackgroundProps) {
  const { isDark } = useTheme();

  const primaryColor = isDark ? '#B8D641' : '#a6c13a';
  const secondaryColor = isDark ? '#f9fff3' : '#000100';
  const backgroundColor = isDark ? '#000100' : '#F6FFF9';

  const defaultCircles: BlurCircle[] = React.useMemo(
    () => [
      { top: -100, left: -80, width: 360, height: 360, color: primaryColor + '70' },
      { top: 220, right: -140, width: 460, height: 460, color: primaryColor + '40' },
      { bottom: -80, left: -60, width: 300, height: 300, color: secondaryColor + '50' },
    ],
    [primaryColor, secondaryColor],
  );

  const resolvedCircles = circles ?? defaultCircles;
  const resolvedBlurAmount = blurAmount ?? (Platform.OS === 'ios' ? 80 : 96);

  return (
    <>
      <Box style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {resolvedCircles.map((circle, index) => (
          <Box
            key={index}
            className="absolute rounded-full"
            style={{
              top: circle.top,
              bottom: circle.bottom,
              left: circle.left,
              right: circle.right,
              width: circle.width,
              height: circle.height,
              backgroundColor: circle.color,
            }}
          />
        ))}
      </Box>

      <BlurView
        blurAmount={resolvedBlurAmount}
        blurType={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFillObject}
      />

      {Platform.OS === 'android' ? (
        <Box
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: backgroundColor + androidOverlayOpacity },
          ]}
          pointerEvents="none"
        />
      ) : null}
    </>
  );
}