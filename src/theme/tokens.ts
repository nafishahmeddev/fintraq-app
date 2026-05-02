/**
 * Design Tokens - Luno Design System
 * 
 * A systematic approach to design constants following fintech best practices.
 * Focused on consistency, accessibility, and high-performance UI.
 */

// ============================================
// 1. SPACING (4px Base Grid)
// ============================================
export const spacing = {
  0: 0,
  2: 2,
  4: 4,
  8: 8,
  12: 12,
  16: 16,
  20: 20,
  24: 24,
  32: 32,
  40: 40,
  48: 48,
  64: 64,
  80: 80,
  96: 96,
} as const;

export type Spacing = keyof typeof spacing;

// ============================================
// 2. RADIUS (Border Radius)
// ============================================
export const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  full: 9999,
} as const;

export type Radius = keyof typeof radius;

// ============================================
// 3. SHADOWS (Elevation)
// ============================================
export const shadow = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export type Shadow = keyof typeof shadow;

// ============================================
// 4. LAYOUT (Grid & Structure)
// ============================================
export const layout = {
  screenPadding: spacing[24],
  sectionGap: spacing[32],
  itemGap: spacing[16],
  elementGap: spacing[8],
  cardPadding: spacing[20],
  listItemHeight: 56,
  touchTarget: 44,
  maxWidth: 480,
} as const;

// ============================================
// 5. ANIMATION (Timing)
// ============================================
export const animation = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

// ============================================
// 6. OPACITY
// ============================================
export const opacity = {
  muted: 0.6,
  subtle: 0.4,
  disabled: 0.2,
} as const;

// ============================================
// 7. Z-INDEX
// ============================================
export const zIndex = {
  base: 0,
  drawer: 10,
  modal: 20,
  overlay: 30,
  toast: 40,
} as const;
