import React from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { GlassSurface } from './GlassSurface';
import { Symbol, SymbolKey } from './Symbol';
import { usePalette } from './usePalette';
import { usePressFeedback } from './usePressFeedback';

export interface GlassIconButtonProps {
  icon: SymbolKey;
  /** Diámetro. El área táctil nunca baja de 44 pt. */
  size?: number;
  onPress?: () => void;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Botón redondo de vidrio. Al tocarlo se hunde con resorte y se ilumina.
 * Sin `onPress` funciona como insignia, pero igual responde al toque.
 */
export function GlassIconButton({ icon, size = 44, onPress, accessibilityLabel, style }: GlassIconButtonProps) {
  const palette = usePalette();
  const press = usePressFeedback(0.88);
  const slop = Math.max(0, (44 - size) / 2);

  return (
    <Animated.View style={[press.container, style]}>
      <Pressable
        onPress={onPress}
        {...press.handlers}
        hitSlop={slop}
        accessibilityRole={onPress ? 'button' : 'image'}
        accessibilityLabel={accessibilityLabel}
      >
        <GlassSurface
          radius={size / 2}
          interactive={!!onPress}
          contentStyle={[styles.center, { width: size, height: size }]}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: size / 2,
                backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.8)',
              },
              press.highlight,
            ]}
          />
          <Symbol name={icon} size={Math.round(size * 0.42)} weight="medium" />
        </GlassSurface>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
