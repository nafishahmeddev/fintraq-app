export type ThemePalette = {
  background: string;
  card: string;
  surface: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  danger: string;
  warning: string;
};

export const DARK_THEME: ThemePalette = {
  background: '#0a0a0a',
  card: '#141414',
  surface: '#1a1a1a',
  primary: '#B8D641',
  primaryLight: '#c5e055',
  primaryDark: '#9fc223',
  secondary: '#f0f4e6',
  text: '#f5f5f0',
  textMuted: '#8a8a80',
  border: '#2d2d2d',
  success: '#5fd38e',
  danger: '#ef5350',
  warning: '#ffa726',
};

export const LIGHT_THEME: ThemePalette = {
  background: '#F7F4EF',
  card: '#FFFFFF',
  surface: '#FAFAF8',
  primary: '#9db433',
  primaryLight: '#b3c94d',
  primaryDark: '#7a9a20',
  secondary: '#1a1a1a',
  text: '#1a1a1a',
  textMuted: '#6b6b5f',
  border: '#E8E5E0',
  success: '#3da86a',
  danger: '#dc4444',
  warning: '#c77d0c',
};

export type ThemeColors = ThemePalette;
