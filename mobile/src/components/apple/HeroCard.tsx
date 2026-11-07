import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { appleLight, radii } from './tokens';

export interface HeroCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Tarjeta superior lavanda que se extiende bajo la barra de estado. */
export function HeroCard({ children, style }: HeroCardProps) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={[appleLight.heroTop, appleLight.heroBottom]}
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
