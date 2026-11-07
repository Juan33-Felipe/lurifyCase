import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { usePalette } from './usePalette';

export interface GlassSurfaceProps {
  radius: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /** Sombra exterior suave. Desactívala en superficies anidadas. */
  elevated?: boolean;
  /** En iOS 26, el vidrio nativo reacciona al toque. */
  interactive?: boolean;
  children?: React.ReactNode;
}

const nativeGlass = Platform.OS === 'ios' && isLiquidGlassAvailable();

/**
 * Vidrio claro.
 * - iOS 26 o superior: Liquid Glass nativo (expo-glass-effect), con el tema de la app.
 * - iOS anterior y web: desenfoque con expo-blur más relleno blanco translúcido.
 * - Android: relleno translúcido sin desenfoque (expo-blur requiere una vista de destino para difuminar).
 */
export function GlassSurface({ radius, style, contentStyle, elevated = true, interactive, children }: GlassSurfaceProps) {
  const palette = usePalette();
  const g = palette.glass;
  if (nativeGlass) {
    return (
      <GlassView
        glassEffectStyle="regular"
        colorScheme={palette.mode}
        isInteractive={interactive}
        style={[{ borderRadius: radius, overflow: 'hidden' }, style, contentStyle]}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <View
      style={[
        { borderRadius: radius },
        elevated && [styles.shadow, { shadowColor: g.shadow, shadowOpacity: g.shadowOpacity }],
        style,
      ]}
    >
      <View style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}>
        {Platform.OS !== 'android' && (
          <BlurView intensity={40} tint={palette.mode} style={StyleSheet.absoluteFill} />
        )}
        <LinearGradient
          colors={[g.fillTop, g.fillBottom]}
          style={StyleSheet.absoluteFill}
        />
        {/* Brillo del borde superior, como el reflejo del vidrio de iOS. */}
        <LinearGradient
          colors={[g.sheen, 'rgba(255,255,255,0)']}
          style={[styles.sheen, { borderTopLeftRadius: radius, borderTopRightRadius: radius }]}
        />
      </View>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.border, { borderRadius: radius, borderColor: g.border }]}
      />
      <View style={contentStyle}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  sheen: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '50%',
  },
  border: {
    borderWidth: 1,
  },
});
