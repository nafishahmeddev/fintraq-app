import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Theme, useTheme } from '../../providers/ThemeProvider';

export type SectionLabelSize = 'sm' | 'md' | 'lg';

export interface SectionLabelProps {
  text: string;
  size?: SectionLabelSize;
  uppercase?: boolean;
  letterSpacing?: number;
  style?: ViewStyle;
  rightElement?: React.ReactNode;
}

export const SectionLabel = React.memo(function SectionLabel({
  text,
  size = 'md',
  uppercase = false,
  letterSpacing,
  style,
  rightElement,
}: SectionLabelProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const dimensions = React.useMemo(() => {
    switch (size) {
      case 'sm':
        return {
          fontSize: 10,
          letterSpacing: 0.3,
          fontFamily: theme.fontFamilies.sansSemiBold,
        };
      case 'lg':
        return {
          fontSize: 14,
          letterSpacing: -0.2,
          fontFamily: theme.fontFamilies.sansMedium,
        };
      case 'md':
      default:
        return {
          fontSize: 12,
          letterSpacing: 0,
          fontFamily: theme.fontFamilies.sansMedium,
        };
    }
  }, [size, theme.fontFamilies]);

  return (
    <View style={[styles.container, style]}>
      <Text
        style={[
          styles.label,
          {
            fontSize: dimensions.fontSize,
            letterSpacing: letterSpacing ?? dimensions.letterSpacing,
            fontFamily: dimensions.fontFamily,
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

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    label: {},
  });

export default SectionLabel;
