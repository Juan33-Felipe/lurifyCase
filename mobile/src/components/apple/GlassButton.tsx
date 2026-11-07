import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { GlassSurface } from './GlassSurface';
import { Symbol, SymbolKey } from './Symbol';
import { Text } from './Text';
import { appleLight, radii } from './tokens';

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

/** Botón píldora de vidrio claro con el ícono dentro de un círculo. */
export function GlassButton({ label, onPress, icon, loading, disabled, style, accessibilityHint }: GlassButtonProps) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const inactive = disabled || loading;

  return (
    <Animated.View style={[animated, inactive && styles.dim, style]}>
      <Pressable
        onPress={onPress}
        disabled={inactive}
        onPressIn={() => scale.set(withTiming(0.97, { duration: 90 }))}
        onPressOut={() => scale.set(withTiming(1, { duration: 160 }))}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      >
        <GlassSurface radius={radii.pill} interactive contentStyle={styles.content}>
          <Text variant="callout" style={styles.label}>
            {label}
          </Text>
          {(icon || loading) && (
            <View style={styles.circle}>
              {loading ? (
                <ActivityIndicator size="small" color={appleLight.label} />
              ) : (
                <Symbol name={icon!} size={13} weight="semibold" />
              )}
            </View>
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
  label: {
    fontSize: 16.5,
  },
  circle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: 'rgba(28,28,30,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dim: {
    opacity: 0.6,
  },
});
