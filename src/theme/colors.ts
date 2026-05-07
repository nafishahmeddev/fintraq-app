import { lime, neutral, green, red, amber, blue } from './primitives';

/**
 * Semantic color tokens — what all components reference via useTheme().
 *
 * 4-level surface elevation system (filled-only, no borders, no shadows):
 *
 *   Dark:  background (#0D0D0D) < surface (#191919) < overlay (#252525) < floating (#313131)
 *   Light: background (#F5F5F5) → surface (#FFFFFF) ← overlay (#EDEDED) ← floating (#FFFFFF)
 *
 * Primitives live in primitives.ts — components never import that file.
 */
export type ThemePalette = {
  // Backgrounds — 4 elevation levels
  background: string;     // L0: screen / page background
  surface: string;        // L1: cards, panels, list items
  overlay: string;        // L2: inputs, chips, icon boxes, avatar placeholders
  floating: string;       // L3: modals, sheets, popovers, dropdowns

  // Text
  text: string;           // primary content
  textMuted: string;      // secondary content
  textFaint: string;      // disabled / tertiary

  // Brand accent (lime)
  primary: string;        // interactive: CTAs, active states, focus rings
  primaryHover: string;   // pressed / hover variant
  primarySubtle: string;  // tinted background: badges, tags, highlights
  onPrimary: string;      // text & icons ON primary-colored surfaces

  // Semantic feedback
  success: string;
  successSubtle: string;
  danger: string;
  dangerSubtle: string;
  warning: string;
  warningSubtle: string;
  info: string;
  infoSubtle: string;

  // Border — transparent in filled-only design
  border: string;
};

export const DARK_THEME: ThemePalette = {
  // 4 elevation levels: +12 lightness step per layer (hex)
  background:  '#0D0D0D',   // L0
  surface:     '#191919',   // L1 — cards, panels
  overlay:     '#252525',   // L2 — inputs, chips
  floating:    '#313131',   // L3 — modals, sheets

  text:        neutral[100],          // #F5F5F5
  textMuted:   neutral[400],          // #A3A3A3
  textFaint:   neutral[600],          // #525252

  primary:     lime[400],             // #A3E635 — electric lime on dark
  primaryHover: lime[300],            // #BEF264
  primarySubtle: lime[400] + '22',    // @13% opacity
  onPrimary:   '#0D0D0D',            // dark text on lime

  success:       green[500],          // #22C55E
  successSubtle: green[500] + '22',
  danger:        red[400],            // #F87171
  dangerSubtle:  red[400] + '22',
  warning:       amber[400],          // #FBBF24
  warningSubtle: amber[400] + '22',
  info:          blue[400],           // #60A5FA
  infoSubtle:    blue[400] + '22',

  border:      'transparent',
};

export const LIGHT_THEME: ThemePalette = {
  background:  neutral[100],          // #F5F5F5 — cool grey page
  surface:     neutral[0],            // #FFFFFF — white cards
  overlay:     '#EDEDED',             // grey inputs — inset feel on white card
  floating:    neutral[0],            // #FFFFFF — white modals

  text:        neutral[950],          // #0D0D0D
  textMuted:   neutral[500],          // #737373
  textFaint:   neutral[400],          // #A3A3A3

  primary:     lime[600],             // #65A30D — readable lime on white
  primaryHover: lime[500],            // #84CC16
  primarySubtle: lime[600] + '22',
  onPrimary:   neutral[0],            // #FFFFFF — white text on lime

  success:       green[600],          // #16A34A
  successSubtle: green[600] + '22',
  danger:        red[600],            // #DC2626
  dangerSubtle:  red[600] + '22',
  warning:       amber[600],          // #D97706
  warningSubtle: amber[600] + '22',
  info:          blue[600],           // #2563EB
  infoSubtle:    blue[600] + '22',

  border:      'transparent',
};

export type ThemeColors = ThemePalette;
