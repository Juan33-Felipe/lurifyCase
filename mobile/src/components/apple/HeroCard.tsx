import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radii } from './tokens';
import { usePalette } from './usePalette';

export interface HeroCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Tarjeta superior que se extiende bajo la barra de estado. */
export function HeroCard({ children, style }: HeroCardProps) {
  const insets = useSafeAreaInsets();
  const palette = usePalette();
  return (
    <LinearGradient
      colors={[palette.heroTop, palette.heroBottom]}
      style={[styles.card, { paddingTop: insets.top + 12 }, style]}
    >
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
  },
});
