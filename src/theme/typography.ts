/**
 * Typography Tokens - Luno Design System
 * 
 * In React Native with custom fonts, weight is handled by the fontFamily itself.
 */

export const fontFamilies = {
  // Brand / Display
  heading: 'BricolageGrotesque_700Bold',
  headingRegular: 'BricolageGrotesque_400Regular',
  
  // Body / Interface
  sans: 'BricolageGrotesque_400Regular',
  sansMedium: 'BricolageGrotesque_500Medium',
  sansSemiBold: 'BricolageGrotesque_600SemiBold',
  sansBold: 'BricolageGrotesque_700Bold',
  
  // Technical / Data
  mono: 'JetBrainsMono_400Regular',
  monoBold: 'JetBrainsMono_700Bold',
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

export const lineHeights = {
  none: 1,
  tight: 1.1,
  snug: 1.25,
  normal: 1.5,
  relaxed: 1.75,
} as const;

export const letterSpacing = {
  tight: -1,
  snug: -0.5,
  normal: 0,
  wide: 0.5,
} as const;

export type FontSize = keyof typeof fontSizes;
export type FontFamily = keyof typeof fontFamilies;
