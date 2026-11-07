import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { appleLight } from './tokens';

/**
 * Fondo gris agrupado de iOS con manchas de color difuminadas.
 * Las manchas dan algo que "ver a través" del vidrio; sin ellas, el vidrio no se lee.
 */
export function AmbientBackground({ children }: { children: React.ReactNode }) {
  const [lavender, sky, rose] = appleLight.blobs;
  return (
    <View style={styles.root}>
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 200" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <Blob id="lavender" color={lavender} />
          <Blob id="sky" color={sky} />
          <Blob id="rose" color={rose} />
        </Defs>
        <Circle cx="8" cy="112" r="46" fill="url(#lavender)" />
        <Circle cx="100" cy="140" r="44" fill="url(#sky)" />
        <Circle cx="40" cy="196" r="40" fill="url(#rose)" />
      </Svg>
      {children}
    </View>
  );
}

function Blob({ id, color }: { id: string; color: string }) {
  return (
    <RadialGradient id={id} cx="50%" cy="50%" r="50%">
      <Stop offset="0" stopColor={color} stopOpacity={0.85} />
      <Stop offset="0.55" stopColor={color} stopOpacity={0.35} />
      <Stop offset="1" stopColor={color} stopOpacity={0} />
    </RadialGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: appleLight.groupedBackground,
  },
});
