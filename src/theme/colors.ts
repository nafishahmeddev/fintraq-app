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
 * Navy Luxury — Final (Fixed Contrast Layers)
 * Clear separation: background < card < surface
 */

export const DARK_THEME: ThemePalette = {
  background: '#080A0F',        // deep blue-black for navy feel
  card: '#0E1218',              // +1 level
  surface: '#161B24',           // +2 level — inputs, chips

  primary: '#2347C5',           // richer navy blue
  primaryLight: '#4B7FFF',      // vibrant interactive blue
  primaryDark: '#1A3899',

  onPrimary: '#FFFFFF',

  backgroundNeutral: '#161B24',

  secondary: '#D4AF5A',         // richer gold

  text: '#EFF1F5',              // slightly warm white
  textMuted: '#8891A0',

  border: '#1E2530',            // stronger — brutalist separation

  success: '#22C55E',           // proper emerald (income / positive)
  danger: '#F87171',            // clean red (expense / negative)
  warning: '#D4AF5A',           // gold — matches secondary
  info: '#60A5FA',              // sky blue — distinct from success
};

export const LIGHT_THEME: ThemePalette = {
  background: '#F6F8FC',        // cool off-white page
  card: '#FFFFFF',              // pure white cards
  surface: '#EEF1F7',          // cool grey — inputs, chips

  primary: '#2347C5',           // same navy
  primaryLight: '#4B7FFF',
  primaryDark: '#1A3899',

  onPrimary: '#FFFFFF',

  backgroundNeutral: '#EEF1F7',

  secondary: '#CA9F2E',         // rich amber gold

  text: '#080A0F',              // near-black
  textMuted: '#616978',

  border: '#DDE3EC',            // clean editorial border

  success: '#16A34A',           // dark green for light bg (income)
  danger: '#DC2626',            // clean red (expense)
  warning: '#CA9F2E',           // matches secondary
  info: '#3B82F6',              // medium blue — distinct from success
};

export type ThemeColors = ThemePalette;