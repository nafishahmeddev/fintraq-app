import React, { useMemo } from 'react';
import { StyleSheet, Text, TextProps, TextStyle } from 'react-native';
import { Theme, useTheme } from '../../providers/ThemeProvider';

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
  weight?: keyof Theme['fontFamilies'];
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
  const theme = useTheme();
  const { colors, fontFamilies, fontSizes } = theme;

  const variantStyle = useMemo(() => {
    switch (variant) {
      case 'h1':
        return {
          fontSize: fontSizes['3xl'],
          fontFamily: fontFamilies.sansBold,
          lineHeight: fontSizes['3xl'] * 1.1,
          letterSpacing: -1,
        };
      case 'h2':
        return {
          fontSize: fontSizes['2xl'],
          fontFamily: fontFamilies.sansSemiBold,
          lineHeight: fontSizes['2xl'] * 1.2,
          letterSpacing: -0.6,
        };
      case 'h3':
        return {
          fontSize: fontSizes.xl,
          fontFamily: fontFamilies.sansSemiBold,
          lineHeight: fontSizes.xl * 1.2,
          letterSpacing: -0.4,
        };
      case 'body':
        return {
          fontSize: fontSizes.md,
          fontFamily: fontFamilies.sans,
          lineHeight: fontSizes.md * 1.5,
        };
      case 'bodySm':
        return {
          fontSize: fontSizes.sm,
          fontFamily: fontFamilies.sans,
          lineHeight: fontSizes.sm * 1.5,
        };
      case 'label':
        return {
          fontSize: fontSizes.xs,
          fontFamily: fontFamilies.sansSemiBold,
          color: colors.textMuted,
          textTransform: 'uppercase' as const,
          letterSpacing: 0.5,
        };
      case 'mono':
        return {
          fontSize: fontSizes.md,
          fontFamily: fontFamilies.mono,
        };
      case 'monoSm':
        return {
          fontSize: fontSizes.sm,
          fontFamily: fontFamilies.mono,
        };
      default:
        return {};
    }
  }, [variant, colors.textMuted, fontFamilies, fontSizes]);

  const customStyle: TextStyle = {
    color: color || colors.text,
    textAlign: align,
    fontFamily: weight ? fontFamilies[weight] : undefined,
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
