import { useColorScheme } from 'nativewind';
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { useSettings } from './SettingsProvider';

type ThemeContextType = {
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
  isDark: true,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = React.memo(function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useSettings();
  const systemColorScheme = useRNColorScheme();
  const { setColorScheme } = useColorScheme();

  const isDark = profile.theme === 'system'
    ? systemColorScheme === 'dark'
    : profile.theme === 'dark';

  useEffect(() => {
    setColorScheme(isDark ? 'dark' : 'light');
  }, [isDark, setColorScheme]);

  const contextValue = useMemo(() => ({ isDark }), [isDark]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
});
