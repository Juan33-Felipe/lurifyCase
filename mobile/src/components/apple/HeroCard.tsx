import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radii } from './tokens';
import { usePalette } from './usePalette';

export interface HeroCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Tarjeta superior que se extiende bajo la barra de estado con acabado
 * Gris Plata / Silver dicroico tornasol (morado reducido al mínimo absoluto,
 * destacando el tono plateado y el verde lima/oliva metálico).
 */
export function HeroCard({ children, style }: HeroCardProps) {
  const insets = useSafeAreaInsets();
  const palette = usePalette();
  const isDark = palette.mode === 'dark';

  // Base: en modo claro el tono morado está casi neutralizado en plata pura,
  // manteniendo el verde lima/oliva metálico visible
  const silverColors: [string, string, ...string[]] = isDark
    ? [
        '#22242A',
        '#272930',
        '#292C34',
        '#26282E',
        '#282D29',
        '#292D2A',
        '#212328',
      ]
    : [
        '#E6E9EE', // plata pura clara
        '#E3E1E7', // apenas un suspiro perlado casi imperceptible
        '#DEE1E7', // plata satinada fría
        '#D9DFE8', // plata pura central
        '#D3DFC8', // verde lima metálico evidente
        '#CAD7BD', // verde oliva metálico satinado
        '#DFE4EC', // plata final brillante
      ];

  return (
    <LinearGradient
      colors={silverColors}
      locations={[0, 0.18, 0.35, 0.5, 0.65, 0.82, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { paddingTop: insets.top + 12 }, style]}
    >
      {/* Destellos tornasol: morado ultra-atenuado ("muy poquito") y verde lima/oliva presente */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%" viewBox="0 0 400 320" preserveAspectRatio="none">
          <Defs>
            {/* Lóbulo Magenta / Morado reducido a un matiz mínimo (0.12 opacidad) */}
            <RadialGradient id="heroTornasolMagenta" cx="22%" cy="28%" rx="58%" ry="52%">
              <Stop
                offset="0%"
                stopColor={isDark ? '#6B4A5E' : '#D69EBC'}
                stopOpacity={isDark ? 0.06 : 0.12}
              />
              <Stop
                offset="55%"
                stopColor={isDark ? '#3E343D' : '#E8D4DF'}
                stopOpacity={isDark ? 0.02 : 0.04}
              />
              <Stop offset="100%" stopColor="#CCD1D9" stopOpacity={0} />
            </RadialGradient>

            {/* Lóbulo Verde Lima / Oliva Metálico con color agradable */}
            <RadialGradient id="heroTornasolOliveLime" cx="78%" cy="64%" rx="60%" ry="54%">
              <Stop
                offset="0%"
                stopColor={isDark ? '#627340' : '#A0BD54'}
                stopOpacity={isDark ? 0.16 : 0.36}
              />
              <Stop
                offset="55%"
                stopColor={isDark ? '#3C4529' : '#C1D38C'}
                stopOpacity={isDark ? 0.05 : 0.18}
              />
              <Stop offset="100%" stopColor="#CCD1D9" stopOpacity={0} />
            </RadialGradient>

            {/* Brillo especular plateado central predominante (Silver Core) */}
            <RadialGradient id="heroTornasolSilverCore" cx="48%" cy="38%" rx="65%" ry="55%">
              <Stop
                offset="0%"
                stopColor="#FFFFFF"
                stopOpacity={isDark ? 0.22 : 0.65}
              />
              <Stop
                offset="45%"
                stopColor={isDark ? '#8D97A5' : '#E8EEF5'}
                stopOpacity={isDark ? 0.1 : 0.35}
              />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
            </RadialGradient>

            {/* Reflejo metálico de luz plateada superior */}
            <RadialGradient id="heroSilverSheen" cx="50%" cy="5%" rx="70%" ry="25%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={isDark ? 0.22 : 0.62} />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
            </RadialGradient>
          </Defs>

          <Ellipse cx="88" cy="90" rx="230" ry="165" fill="url(#heroTornasolMagenta)" />
          <Ellipse cx="312" cy="202" rx="235" ry="170" fill="url(#heroTornasolOliveLime)" />
          <Ellipse cx="195" cy="120" rx="240" ry="160" fill="url(#heroTornasolSilverCore)" />
          <Ellipse cx="200" cy="15" rx="260" ry="60" fill="url(#heroSilverSheen)" />
        </Svg>

        {/* Velo diagonal de interferencia con morado prácticamente imperceptible */}
        <LinearGradient
          colors={
            isDark
              ? [
                  'rgba(255, 255, 255, 0.09)',
                  'rgba(230, 235, 245, 0.04)',
                  'rgba(140, 170, 90, 0.03)',
                  'rgba(255, 255, 255, 0.06)',
                ]
              : [
                  'rgba(255, 255, 255, 0.52)',
                  'rgba(225, 175, 200, 0.05)',
                  'rgba(165, 195, 85, 0.20)',
                  'rgba(255, 255, 255, 0.45)',
                ]
          }
          locations={[0, 0.35, 0.7, 1]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderBottomLeftRadius: radii.hero,
    borderBottomRightRadius: radii.hero,
    paddingHorizontal: 22,
    paddingBottom: 30,
    overflow: 'hidden',
  },
});
