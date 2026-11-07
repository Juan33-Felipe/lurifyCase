import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { SymbolView, SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { usePalette } from './usePalette';

type SymbolName = Exclude<SymbolViewProps['name'], string>;

/**
 * Catálogo de íconos del kit. Cada uno declara su SF Symbol (iOS)
 * y su equivalente de Material Symbols (Android y web).
 */
export const symbols = {
  mail: { ios: 'envelope', android: 'mail', web: 'mail' },
  lock: { ios: 'lock', android: 'lock', web: 'lock' },
  eye: { ios: 'eye', android: 'visibility', web: 'visibility' },
  eyeSlash: { ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' },
  person: { ios: 'person', android: 'person', web: 'person' },
  arrowRight: { ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' },
  plus: { ios: 'plus', android: 'add', web: 'add' },
  error: { ios: 'exclamationmark.circle', android: 'error', web: 'error' },
  brand: { ios: 'building.columns', android: 'account_balance', web: 'account_balance' },
} satisfies Record<string, SymbolName>;

export type SymbolKey = keyof typeof symbols;

export interface AppleSymbolProps {
  name: SymbolKey;
  size?: number;
  color?: string;
  weight?: SymbolWeight;
  style?: StyleProp<ViewStyle>;
}

export function Symbol({ name, size = 17, color, weight = 'regular', style }: AppleSymbolProps) {
  const palette = usePalette();
  return (
    <SymbolView
      name={symbols[name]}
      size={size}
      tintColor={color ?? palette.label}
      weight={weight}
      style={style}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
