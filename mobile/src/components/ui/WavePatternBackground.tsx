import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';

interface WavePatternBackgroundProps {
  /** Adjusts wave stroke opacity for Hero Header vs compact Cards. */
  variant?: 'hero' | 'card';
}

/**
 * Renders subtle abstract topographic/wave contour lines in low-opacity white/silver
 * inside the Deep Charcoal Hero Header and Active Cards (Part 1.2 & Phase 1.2).
 */
export function WavePatternBackground({ variant = 'hero' }: WavePatternBackgroundProps) {
  const baseOpacity = variant === 'hero' ? 0.12 : 0.09;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 400 240"
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <SvgGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={baseOpacity * 0.4} />
            <Stop offset="50%" stopColor="#FFFFFF" stopOpacity={baseOpacity * 1.4} />
            <Stop offset="100%" stopColor="#A1A1AA" stopOpacity={baseOpacity * 0.3} />
          </SvgGradient>
          <SvgGradient id="waveGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={baseOpacity * 1.2} />
            <Stop offset="65%" stopColor="#A1A1AA" stopOpacity={baseOpacity * 0.7} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </SvgGradient>
        </Defs>

        {/* Primary sweeping wave */}
        <Path
          d="M-40 190 C 60 110, 170 230, 280 130 C 350 70, 390 110, 450 60"
          stroke="url(#waveGrad1)"
          strokeWidth={1.5}
          fill="none"
        />
        <Path
          d="M-40 212 C 70 132, 180 250, 292 148 C 360 88, 395 128, 450 82"
          stroke="url(#waveGrad1)"
          strokeWidth={1.1}
          fill="none"
        />
        <Path
          d="M-40 234 C 82 154, 192 268, 305 168 C 370 108, 405 145, 450 104"
          stroke="url(#waveGrad1)"
          strokeWidth={0.9}
          fill="none"
        />

        {/* Upper right topographic contour arcs */}
        <Path
          d="M170 -20 C 210 65, 310 95, 420 45"
          stroke="url(#waveGrad2)"
          strokeWidth={1.4}
          fill="none"
        />
        <Path
          d="M195 -25 C 232 48, 322 76, 425 26"
          stroke="url(#waveGrad2)"
          strokeWidth={1}
          fill="none"
        />
        <Path
          d="M225 -30 C 258 32, 336 56, 430 8"
          stroke="url(#waveGrad2)"
          strokeWidth={0.8}
          fill="none"
        />

        {/* Soft ambient glow ring in corner */}
        <Path
          d="M-25 45 C 35 25, 85 65, 115 15 C 135 -15, 165 -10, 185 -30"
          stroke="url(#waveGrad2)"
          strokeWidth={1}
          fill="none"
        />
      </Svg>
    </View>
  );
}
