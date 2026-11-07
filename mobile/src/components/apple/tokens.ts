import { Platform, TextStyle } from 'react-native';

/**
 * Tokens del kit estilo Apple.
 * Por ahora solo existe la paleta clara. Para agregar el modo oscuro, crea `appleDark`
 * con la misma forma (`ApplePalette`) y elige la paleta según el tema.
 */
export const appleLight = {
  groupedBackground: '#F2F2F7',
  surface: '#FFFFFF',
  label: '#1C1C1E',
  secondaryLabel: '#8E8E93',
  placeholder: '#A1A1A6',
  separator: '#E5E5EA',
  heroTop: '#E9E6F7',
  heroBottom: '#E2E4F6',
  blobs: ['#CFC8F3', '#C9E7F2', '#F3D9E6'] as const,
  danger: '#D93036',
  glass: {
    fillTop: 'rgba(255,255,255,0.66)',
    fillBottom: 'rgba(255,255,255,0.38)',
    border: 'rgba(255,255,255,0.9)',
    highlight: 'rgba(255,255,255,1)',
    shadow: '#3C3C5A',
    thumb: 'rgba(255,255,255,0.96)',
  },
};

export type ApplePalette = typeof appleLight;

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
