import React from 'react';
import { Text as RNText, TextProps } from 'react-native';
import { fontWeight, typography, TypographyVariant } from './tokens';
import { usePalette } from './usePalette';

export interface AppleTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
  weight?: '400' | '500' | '600' | '700';
}

/** Texto con la escala tipográfica de iOS: SF Pro en iPhone, Inter en Android y web. */
export function Text({ variant = 'body', color, weight, style, ...rest }: AppleTextProps) {
  const palette = usePalette();
  return (
    <RNText
      {...rest}
      style={[typography[variant], { color: color ?? palette.label }, weight ? fontWeight(weight) : null, style]}
    />
  );
}
