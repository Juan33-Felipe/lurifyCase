import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { GlassSurface } from './GlassSurface';
import { Symbol, SymbolKey } from './Symbol';
import { Text } from './Text';
import { radii } from './tokens';
import { usePalette } from './usePalette';
import { usePressFeedback } from './usePressFeedback';

export interface GlassButtonProps {
  label: string;
  onPress: () => void;
  /** Ícono dentro del círculo, a la derecha del texto. */
  icon?: SymbolKey;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

const HEIGHT = 52;

/**
 * Botón píldora de vidrio con el ícono dentro de un círculo.
 * Al tocarlo se hunde con resorte, se ilumina y el ícono avanza un poco.
 */
export function GlassButton({ label, onPress, icon, loading, disabled, style, accessibilityHint }: GlassButtonProps) {
  const palette = usePalette();
  const press = usePressFeedback(0.95);
  const inactive = disabled || loading;

  return (
    <Animated.View style={[press.container, inactive && styles.dim, style]}>
      <Pressable
        onPress={onPress}
        disabled={inactive}
        {...press.handlers}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      >
        <GlassSurface radius={radii.pill} interactive contentStyle={styles.content}>
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              styles.highlight,
              { backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.7)' },
              press.highlight,
            ]}
          />
          <Text variant="callout" style={styles.label}>
            {label}
          </Text>
          {(icon || loading) && (
            <Animated.View style={[styles.circle, { borderColor: palette.glass.ring }, !loading && press.nudge]}>
              {loading ? (
                <ActivityIndicator size="small" color={palette.label} />
              ) : (
                <Symbol name={icon!} size={13} weight="semibold" />
              )}
            </Animated.View>
          )}
        </GlassSurface>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: {
    height: HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  highlight: {
    borderRadius: HEIGHT / 2,
  },
  label: {
    fontSize: 16.5,
  },
  circle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dim: {
    opacity: 0.6,
  },
});
