export type ThemeMode = 'light' | 'dark';

export interface Palette {
  mode: ThemeMode;
  /** Primary screen background (#F8F9FB in light, #121214 in dark). */
  background: string;
  /** Pure card surface (#FFFFFF in light, #1C1C1F in dark). */
  surface: string;
  /** Elevated surface for modals/sheets. */
  surfaceElevated: string;
  /** Deep charcoal surface for Hero Header & Active Cards (#242426). */
  charcoal: string;
  /** Deeper charcoal for nested pills/buttons (#1E1E20). */
  charcoalDeep: string;
  /** Soft ice-blue / pale lavender surface for secondary horizontal cards (#F1F4FB). */
  secondaryCard: string;
  /** Subtle border for secondary cards and inputs. */
  border: string;
  /** Primary text on light/surface background (#1E1E20 in light, #F8F9FB in dark). */
  text: string;
  /** Muted cool gray text (#8E8E93). */
  textMuted: string;
  /** Pure white text on dark charcoal cards (#FFFFFF). */
  onCharcoal: string;
  /** Muted silver text on dark charcoal cards (#A1A1AA). */
  onCharcoalMuted: string;
  /** Secondary card text color. */
  onSecondaryCard: string;
  /** Secondary card muted text color. */
  onSecondaryCardMuted: string;
  /** Status & semantic colors. */
  accent: string;
  accentSoft: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  warningSoft: string;
  success: string;
  successSoft: string;
  shadow: string;
  // Backward-compatible keys
  gradient: [string, string, string];
  orbs: [string, string, string, string];
  textOnAccent: string;
  accentGradient: [string, string];
  glassFill: string;
  glassFillStrong: string;
  glassBorder: string;
  glassHighlight: string;
  blurTint: 'light' | 'dark';
  inputFill: string;
}

export const lightPalette: Palette = {
  mode: 'light',
  background: '#F8F9FB',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  charcoal: '#242426',
  charcoalDeep: '#1E1E20',
  secondaryCard: '#F1F4FB',
  border: '#E6E9F2',
  text: '#1E1E20',
  textMuted: '#8E8E93',
  onCharcoal: '#FFFFFF',
  onCharcoalMuted: '#A1A1AA',
  onSecondaryCard: '#1E1E20',
  onSecondaryCardMuted: '#6E717A',
  accent: '#1E1E20',
  accentSoft: '#F1F4FB',
  danger: '#E5484D',
  dangerSoft: 'rgba(229, 72, 77, 0.12)',
  warning: '#F5A623',
  warningSoft: 'rgba(245, 166, 35, 0.14)',
  success: '#2E9F6E',
  successSoft: 'rgba(46, 159, 110, 0.12)',
  shadow: '#1E1E20',
  gradient: ['#F8F9FB', '#F4F6FA', '#EEF1F8'],
  orbs: ['#E8ECF6', '#F1F4FB', '#E5EAF5', '#F1F4FB'],
  textOnAccent: '#FFFFFF',
  accentGradient: ['#242426', '#1E1E20'],
  glassFill: '#FFFFFF',
  glassFillStrong: '#FFFFFF',
  glassBorder: '#E6E9F2',
  glassHighlight: '#FFFFFF',
  blurTint: 'light',
  inputFill: '#FFFFFF',
};

export const darkPalette: Palette = {
  mode: 'dark',
  background: '#121214',
  surface: '#1C1C1F',
  surfaceElevated: '#242428',
  charcoal: '#242426',
  charcoalDeep: '#18181A',
  secondaryCard: '#232631',
  border: '#2E3038',
  text: '#F8F9FB',
  textMuted: '#8E8E93',
  onCharcoal: '#FFFFFF',
  onCharcoalMuted: '#A1A1AA',
  onSecondaryCard: '#F8F9FB',
  onSecondaryCardMuted: '#A1A1AA',
  accent: '#FFFFFF',
  accentSoft: '#262936',
  danger: '#FF6B70',
  dangerSoft: 'rgba(255, 107, 112, 0.16)',
  warning: '#F7B955',
  warningSoft: 'rgba(247, 185, 85, 0.16)',
  success: '#4CC38A',
  successSoft: 'rgba(76, 195, 138, 0.16)',
  shadow: '#000000',
  gradient: ['#121214', '#161619', '#1A1B20'],
  orbs: ['#1C1E26', '#222530', '#191B22', '#232631'],
  textOnAccent: '#1E1E20',
  accentGradient: ['#2C2C30', '#1E1E20'],
  glassFill: '#1C1C1F',
  glassFillStrong: '#242428',
  glassBorder: '#2E3038',
  glassHighlight: '#2E3038',
  blurTint: 'dark',
  inputFill: '#1C1C1F',
};

export const palettes: Record<ThemeMode, Palette> = {
  light: lightPalette,
  dark: darkPalette,
};

export const fonts = {
  hero: 'Outfit_800ExtraBold',
  heading: 'Outfit_700Bold',
  headingMedium: 'Outfit_600SemiBold',
  semibold: 'Outfit_600SemiBold',
  medium: 'Outfit_500Medium',
  body: 'Outfit_400Regular',
  label: 'Outfit_500Medium',
  strong: 'Outfit_700Bold',
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 24,
  card: 28,
  xl: 32,
  pill: 999,
} as const;
