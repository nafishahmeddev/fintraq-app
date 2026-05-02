import React, { createContext, useContext, useMemo } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { DARK_THEME, LIGHT_THEME, ThemeColors } from '../theme/colors';
import {
  animation,
  layout,
  opacity,
  radius,
  shadow,
  spacing,
  zIndex
} from '../theme/tokens';
import {
  fontFamilies,
  fontSizes,
  letterSpacing,
  lineHeights
} from '../theme/typography';
import { useSettings } from './SettingsProvider';

export type Theme = {
  colors: ThemeColors;
  isDark: boolean;
  spacing: typeof spacing;
  radius: typeof radius;
  shadow: typeof shadow;
  layout: typeof layout;
  animation: typeof animation;
  opacity: typeof opacity;
  zIndex: typeof zIndex;
  fontFamilies: typeof fontFamilies;
  fontSizes: typeof fontSizes;
  lineHeights: typeof lineHeights;
  letterSpacing: typeof letterSpacing;
};

const ThemeContext = createContext<Theme>({
  colors: DARK_THEME,
  isDark: true,
  spacing,
  radius,
  shadow,
  layout,
  animation,
  opacity,
  zIndex,
  fontFamilies,
  fontSizes,
  lineHeights,
  letterSpacing,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = React.memo(function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useSettings();
  const systemColorScheme = useColorScheme();

  const isDark = useMemo(() => {
    if (!profile?.theme || profile.theme === 'system') {
      return systemColorScheme === 'dark';
    }
    return profile.theme === 'dark';
  }, [profile?.theme, systemColorScheme]);

  const colors = useMemo(() => (isDark ? DARK_THEME : LIGHT_THEME), [isDark]);

  const contextValue = useMemo(() => ({
    colors,
    isDark,
    spacing,
    radius,
    shadow,
    layout,
    animation,
    opacity,
    zIndex,
    fontFamilies,
    fontSizes,
    lineHeights,
    letterSpacing,
  }), [colors, isDark]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      {children}
    </ThemeContext.Provider>
  );
});
