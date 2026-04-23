import React, { useMemo } from 'react';
import { StyleSheet, Text, TextProps, TextStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { ThemeColors } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';

type TypographyVariant = 
  | 'h1' 
  | 'h2' 
  | 'h3' 
  | 'body' 
  | 'bodySm' 
  | 'label' 
  | 'mono' 
  | 'monoSm';

type TypographyProps = TextProps & {
  variant?: TypographyVariant;
  color?: string;
  weight?: keyof typeof TYPOGRAPHY.weights;
  align?: TextStyle['textAlign'];
};

/**
 * Typography - Unified Text Component
 * Strictly follows the Editorial Brutalist typography scale.
 */
export const Typography = React.memo(function Typography({
  variant = 'body',
  color,
  weight,
  align,
  style,
  children,
  ...props
}: TypographyProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const variantStyle = useMemo(() => {
    switch (variant) {
      case 'h1':
        return {
          fontSize: TYPOGRAPHY.sizes.xxxl,
          fontFamily: TYPOGRAPHY.fonts.heading,
          lineHeight: TYPOGRAPHY.sizes.xxxl * 1.1,
          letterSpacing: -1,
        };
      case 'h2':
        return {
          fontSize: TYPOGRAPHY.sizes.xxl,
          fontFamily: TYPOGRAPHY.fonts.semibold,
          lineHeight: TYPOGRAPHY.sizes.xxl * 1.2,
          letterSpacing: -0.6,
        };
      case 'h3':
        return {
          fontSize: TYPOGRAPHY.sizes.xl,
          fontFamily: TYPOGRAPHY.fonts.semibold,
          lineHeight: TYPOGRAPHY.sizes.xl * 1.2,
          letterSpacing: -0.4,
        };
      case 'body':
        return {
          fontSize: TYPOGRAPHY.sizes.md,
          fontFamily: TYPOGRAPHY.fonts.regular,
          lineHeight: TYPOGRAPHY.sizes.md * 1.5,
        };
      case 'bodySm':
        return {
          fontSize: TYPOGRAPHY.sizes.sm,
          fontFamily: TYPOGRAPHY.fonts.regular,
          lineHeight: TYPOGRAPHY.sizes.sm * 1.5,
        };
      case 'label':
        return {
          fontSize: TYPOGRAPHY.sizes.xs,
          fontFamily: TYPOGRAPHY.fonts.medium,
          color: colors.textMuted,
          textTransform: 'uppercase' as const,
          letterSpacing: 0.5,
        };
      case 'mono':
        return {
          fontSize: TYPOGRAPHY.sizes.md,
          fontFamily: TYPOGRAPHY.fonts.monoRegular,
        };
      case 'monoSm':
        return {
          fontSize: TYPOGRAPHY.sizes.sm,
          fontFamily: TYPOGRAPHY.fonts.monoRegular,
        };
      default:
        return {};
    }
  }, [variant, colors.textMuted]);

  const customStyle: TextStyle = {
    color: color || colors.text,
    textAlign: align,
    fontFamily: weight ? TYPOGRAPHY.fonts[weight as keyof typeof TYPOGRAPHY.fonts] : undefined,
  };

  return (
    <Text 
      style={[variantStyle, customStyle, style]} 
      {...props}
    >
      {children}
    </Text>
  );
});

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  // Base styles if any
});
