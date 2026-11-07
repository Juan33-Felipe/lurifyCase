import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Symbol } from './Symbol';
import { Text } from './Text';
import { usePalette } from './usePalette';

/** Mensaje de error en línea, discreto, debajo de los campos. */
export function InlineMessage({ message }: { message: string }) {
  const palette = usePalette();
  return (
    <View style={styles.row} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Symbol name="error" size={15} color={palette.danger} style={styles.icon} />
      <Text variant="footnote" color={palette.danger} style={styles.text}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 6,
  },
  icon: {
    marginTop: 1.5,
  },
  text: {
    flex: 1,
  },
});
