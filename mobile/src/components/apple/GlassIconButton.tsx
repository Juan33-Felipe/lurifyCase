import React from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { GlassSurface } from './GlassSurface';
import { Symbol, SymbolKey } from './Symbol';

export interface GlassIconButtonProps {
  icon: SymbolKey;
  /** Diámetro. El área táctil nunca baja de 44 pt. */
  size?: number;
  onPress?: () => void;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}

/** Botón redondo de vidrio claro. Sin `onPress` se comporta como insignia decorativa. */
export function GlassIconButton({ icon, size = 44, onPress, accessibilityLabel, style }: GlassIconButtonProps) {
  const slop = Math.max(0, (44 - size) / 2);
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      hitSlop={slop}
      accessibilityRole={onPress ? 'button' : 'image'}
      accessibilityLabel={accessibilityLabel}
      style={style}
    >
      <GlassSurface
        radius={size / 2}
        interactive={!!onPress}
        contentStyle={[styles.center, { width: size, height: size }]}
      >
        <Symbol name={icon} size={Math.round(size * 0.42)} weight="medium" />
      </GlassSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
