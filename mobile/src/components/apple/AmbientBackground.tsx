import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { usePalette } from './usePalette';

/**
 * Fondo gris agrupado de iOS con manchas de color difuminadas.
 * Las manchas dan algo que "ver a través" del vidrio; sin ellas, el vidrio no se lee.
 */
export function AmbientBackground({ children }: { children: React.ReactNode }) {
  const palette = usePalette();
  const [slate, sage, mist] = palette.blobs;
  const peak = palette.blobOpacity;
  return (
    <View style={[styles.root, { backgroundColor: palette.groupedBackground }]}>
      <Svg
        width="100%"
        height="100%"
        style={StyleSheet.absoluteFill}
        viewBox="0 0 100 200"
        preserveAspectRatio="xMidYMid slice"
      >
        <Defs>
          <Blob id="slate" color={slate} peak={peak} />
          <Blob id="sage" color={sage} peak={peak} />
          <Blob id="mist" color={mist} peak={peak} />
        </Defs>
        <Circle cx="8" cy="112" r="46" fill="url(#slate)" />
        <Circle cx="100" cy="140" r="44" fill="url(#sage)" />
        <Circle cx="40" cy="196" r="40" fill="url(#mist)" />
      </Svg>
      {children}
    </View>
  );
}

function Blob({ id, color, peak }: { id: string; color: string; peak: number }) {
  return (
    <RadialGradient id={id} cx="50%" cy="50%" r="50%">
      <Stop offset="0" stopColor={color} stopOpacity={peak} />
      <Stop offset="0.55" stopColor={color} stopOpacity={peak * 0.4} />
      <Stop offset="1" stopColor={color} stopOpacity={0} />
    </RadialGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
