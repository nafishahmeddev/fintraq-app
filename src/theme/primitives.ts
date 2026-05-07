/**
 * Primitive color scales — raw values only.
 * Components must NEVER import this file directly.
 * Only colors.ts uses these to derive semantic tokens.
 */

export const lime = {
  50:  '#F7FFE5',
  100: '#ECFCCB',
  200: '#D9F99D',
  300: '#BEF264',
  400: '#A3E635',
  500: '#84CC16',
  600: '#65A30D',
  700: '#4D7C0F',
  800: '#3F6212',
  900: '#365314',
  950: '#1A2E05',
} as const;

export const neutral = {
  0:    '#FFFFFF',
  50:   '#FAFAFA',
  100:  '#F5F5F5',
  150:  '#EBEBEB',
  200:  '#E5E5E5',
  300:  '#D4D4D4',
  400:  '#A3A3A3',
  500:  '#737373',
  600:  '#525252',
  700:  '#404040',
  800:  '#262626',
  850:  '#1C1C1C',
  900:  '#141414',
  950:  '#0D0D0D',
} as const;

export const green  = { 400: '#4ADE80', 500: '#22C55E', 600: '#16A34A' } as const;
export const red    = { 400: '#F87171', 500: '#EF4444', 600: '#DC2626' } as const;
export const amber  = { 400: '#FBBF24', 500: '#F59E0B', 600: '#D97706' } as const;
export const blue   = { 400: '#60A5FA', 500: '#3B82F6', 600: '#2563EB' } as const;
