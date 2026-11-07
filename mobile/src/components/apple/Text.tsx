import React from 'react';
import { Text as RNText, TextProps } from 'react-native';
import { appleLight, fontWeight, typography, TypographyVariant } from './tokens';

export interface AppleTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
  weight?: '400' | '500' | '600' | '700';
}

/** Texto con la escala tipográfica de iOS: SF Pro en iPhone, Inter en Android y web. */
export function Text({ variant = 'body', color = appleLight.label, weight, style, ...rest }: AppleTextProps) {
  return (
    <RNText
      {...rest}
      style={[typography[variant], { color }, weight ? fontWeight(weight) : null, style]}
    />
  );
}
