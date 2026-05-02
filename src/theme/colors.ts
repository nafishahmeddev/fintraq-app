export type ThemePalette = {
  background: string;
  card: string;
  surface: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  onPrimary: string;
  backgroundNeutral: string;
  secondary: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  danger: string;
  warning: string;
  info: string;
};

/**
 * Wise Absolute Color Palette
 * Based on official wise.design foundations (2024)
 * 
 * Primary brand values:
 * Bright Green: #9FE870
 * Forest Green: #163300
 */

export const DARK_THEME: ThemePalette = {
  background: '#163300', // Forest Green (Primary Brand)
  card: '#1E4000',
  surface: '#264D00',
  primary: '#9FE870', // Bright Green
  primaryLight: '#B5EE8D',
  primaryDark: '#163300',
  onPrimary: '#163300', // Forest Green text on Bright Green bg
  backgroundNeutral: '#264D00',
  secondary: '#FFFFFF',
  text: '#FFFFFF',
  textMuted: '#A6B399',
  border: '#2E4D1A',
  success: '#9FE870',
  danger: '#F1404B',
  warning: '#F2BB05',
  info: '#2ED3F2',
};

export const LIGHT_THEME: ThemePalette = {
  background: '#FFFFFF',
  card: '#F2F5F7', // Background Neutral (8% Forest Green tint)
  surface: '#E8EDF1',
  primary: '#9FE870', // Bright Green (Interactive Accent)
  primaryLight: '#B5EE8D',
  primaryDark: '#163300', // Forest Green
  onPrimary: '#163300', // Forest Green text on Bright Green bg
  backgroundNeutral: '#16330014', // 8% Forest Green tint per Wise spec
  secondary: '#163300',
  text: '#163300', // Content Primary (Forest Green based)
  textMuted: '#5D7079', // Content Secondary
  border: '#E2E8ED', // Separator
  success: '#007D44', // Accessible Success Green (for text on white)
  danger: '#D92D20', // Accessible Error Red
  warning: '#F79009', // Accessible Warning Orange
  info: '#00B9FF',
};

export type ThemeColors = ThemePalette;
