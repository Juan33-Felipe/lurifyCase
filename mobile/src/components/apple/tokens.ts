import { Platform, TextStyle } from 'react-native';

/**
 * Tokens del kit estilo Apple. Hay paleta clara y oscura con la misma forma;
 * los componentes eligen la correcta con `usePalette()` según el tema de Ajustes.
 */
export interface ApplePalette {
  mode: 'light' | 'dark';
  groupedBackground: string;
  surface: string;
  label: string;
  secondaryLabel: string;
  placeholder: string;
  separator: string;
  segmentLabel: string;
  heroTop: string;
  heroBottom: string;
  blobs: readonly [string, string, string];
  blobOpacity: number;
  danger: string;
  glass: {
    fillTop: string;
    fillBottom: string;
    border: string;
    sheen: string;
    ring: string;
    shadow: string;
    shadowOpacity: number;
    thumb: string;
  };
}

export const appleLight: ApplePalette = {
  mode: 'light',
  groupedBackground: '#F2F2F7',
  surface: '#FFFFFF',
  label: '#1C1C1E',
  secondaryLabel: '#8E8E93',
  placeholder: '#A1A1A6',
  separator: '#E5E5EA',
  segmentLabel: '#3A3A3C',
  heroTop: '#E6E9EE',
  heroBottom: '#DCE1E8',
  blobs: ['#DCE0E8', '#DFE3DD', '#E5E8EF'],
  blobOpacity: 0.85,
  danger: '#D93036',
  glass: {
    fillTop: 'rgba(255,255,255,0.66)',
    fillBottom: 'rgba(255,255,255,0.38)',
    border: 'rgba(255,255,255,0.9)',
    sheen: 'rgba(255,255,255,0.55)',
    ring: 'rgba(28,28,30,0.5)',
    shadow: '#2E3A48',
    shadowOpacity: 0.12,
    thumb: 'rgba(255,255,255,0.96)',
  },
};

export const appleDark: ApplePalette = {
  mode: 'dark',
  groupedBackground: '#0A0C0F',
  surface: '#1C1C1E',
  label: '#F5F5F7',
  secondaryLabel: '#98989F',
  placeholder: '#6C6C72',
  separator: '#38383A',
  segmentLabel: '#C7C7CC',
  heroTop: '#282A30',
  heroBottom: '#22242A',
  blobs: ['#2E313A', '#2D322F', '#272930'],
  blobOpacity: 0.9,
  danger: '#FF453A',
  glass: {
    fillTop: 'rgba(255,255,255,0.16)',
    fillBottom: 'rgba(255,255,255,0.06)',
    border: 'rgba(255,255,255,0.16)',
    sheen: 'rgba(255,255,255,0.12)',
    ring: 'rgba(245,245,247,0.55)',
    shadow: '#000000',
    shadowOpacity: 0.4,
    thumb: 'rgba(118,118,128,0.6)',
  },
};

export const radii = {
  segment: 12,
  group: 16,
  hero: 30,
  pill: 999,
} as const;

type Weight = '400' | '500' | '600' | '700';

const INTER: Record<Weight, string> = {
  '400': 'Inter_400Regular',
  '500': 'Inter_500Medium',
  '600': 'Inter_600SemiBold',
  '700': 'Inter_700Bold',
};

/**
 * En iOS usa la fuente del sistema (SF Pro). En Android y web usa Inter,
 * porque la licencia de Apple no permite distribuir SF Pro fuera de sus plataformas.
 */
export function fontWeight(weight: Weight): TextStyle {
  return Platform.OS === 'ios' ? { fontWeight: weight } : { fontFamily: INTER[weight] };
}

const isIOS = Platform.OS === 'ios';

/** Escala tipográfica basada en Dynamic Type de iOS. */
export const typography = {
  display: { fontSize: 40, lineHeight: 42, letterSpacing: isIOS ? -0.9 : -1.4, ...fontWeight('700') },
  largeTitle: { fontSize: 34, lineHeight: 41, letterSpacing: isIOS ? 0.4 : -0.9, ...fontWeight('700') },
  title2: { fontSize: 22, lineHeight: 28, letterSpacing: isIOS ? -0.26 : -0.5, ...fontWeight('700') },
  headline: { fontSize: 17, lineHeight: 22, letterSpacing: isIOS ? -0.43 : -0.3, ...fontWeight('600') },
  body: { fontSize: 17, lineHeight: 22, letterSpacing: isIOS ? -0.43 : -0.2, ...fontWeight('400') },
  callout: { fontSize: 16, lineHeight: 21, letterSpacing: isIOS ? -0.31 : -0.2, ...fontWeight('600') },
  subheadline: { fontSize: 15, lineHeight: 20, letterSpacing: isIOS ? -0.23 : -0.1, ...fontWeight('400') },
  footnote: { fontSize: 13, lineHeight: 18, letterSpacing: isIOS ? -0.08 : 0, ...fontWeight('400') },
  caption: { fontSize: 12, lineHeight: 16, letterSpacing: 0, ...fontWeight('400') },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
