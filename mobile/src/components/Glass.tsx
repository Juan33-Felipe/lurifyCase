import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../context/SettingsContext';
import { radius } from '../theme/theme';

/**
 * Clean off-white / dark surface background wrapper for the app shell.
 */
export function GlassBackground({ children }: { children: React.ReactNode }) {
  const palette = useTheme();
  return <View style={{ flex: 1, backgroundColor: palette.background }}>{children}</View>;
}

interface GlassViewProps {
  children?: React.ReactNode;
  style?: any;
  contentStyle?: any;
  strong?: boolean;
  intensity?: number;
  borderRadius?: number;
}

/**
 * Surface card container styled with the clean off-white / lavender-ice / charcoal system.
 */
export function GlassView({
  children,
  style,
  contentStyle,
  strong = false,
  borderRadius = radius.lg,
}: GlassViewProps) {
  const palette = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius,
          backgroundColor: strong ? palette.surface : palette.secondaryCard,
          borderColor: palette.border,
          shadowColor: palette.shadow,
        },
        style,
      ]}
    >
      <View style={contentStyle}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
});
