import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { ThemeColors } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { spacing } from '../../theme/tokens';

export type SectionLabelSize = 'sm' | 'md' | 'lg';

export interface SectionLabelProps {
  text: string;
  size?: SectionLabelSize;
  uppercase?: boolean;
  letterSpacing?: number;
  style?: ViewStyle;
  rightElement?: React.ReactNode;
}

const SIZES = {
  sm: {
    fontSize: 9,
    letterSpacing: 1.2,
    marginBottom: spacing('2'),
  },
  md: {
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: spacing('3'),
  },
  lg: {
    fontSize: 11,
    letterSpacing: 1.8,
    marginBottom: spacing('4'),
  },
};

export const SectionLabel = React.memo(function SectionLabel({
  text,
  size = 'md',
  uppercase = true,
  letterSpacing,
  style,
  rightElement,
}: SectionLabelProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const dimensions = SIZES[size];

  return (
    <View style={[styles.container, style]}>
      <Text
        style={[
          styles.label,
          {
            fontSize: dimensions.fontSize,
            letterSpacing: letterSpacing ?? dimensions.letterSpacing,
            textTransform: uppercase ? 'uppercase' : 'none',
            color: colors.textMuted,
          },
        ]}
      >
        {text}
      </Text>
      {rightElement}
    </View>
  );
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    label: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
    },
  });

export default SectionLabel;
