import React, { forwardRef, useState } from 'react';
import { Platform, Pressable, StyleProp, StyleSheet, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { Symbol, SymbolKey } from './Symbol';
import { appleLight, radii, typography } from './tokens';

const ICON_COLUMN = 44;

export interface GroupedSectionProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Tarjeta blanca con filas separadas por líneas finas, como en Ajustes de iOS. */
export function GroupedSection({ children, style }: GroupedSectionProps) {
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[styles.group, style]}>
      {rows.map((row, i) => (
        <React.Fragment key={i}>
          {i > 0 && <View style={styles.separator} />}
          {row}
        </React.Fragment>
      ))}
    </View>
  );
}

export interface TextFieldRowProps extends TextInputProps {
  icon: SymbolKey;
  /** Etiquetas accesibles del botón de mostrar/ocultar, solo si `secureTextEntry`. */
  showLabel?: string;
  hideLabel?: string;
}

export type TextFieldRowRef = React.ElementRef<typeof TextInput>;

/** Fila de texto con ícono. Si es contraseña, agrega el botón de mostrar/ocultar. */
export const TextFieldRow = forwardRef<TextFieldRowRef, TextFieldRowProps>(function TextFieldRow(
  { icon, secureTextEntry, showLabel = 'Show password', hideLabel = 'Hide password', style, ...rest },
  ref
) {
  const [revealed, setRevealed] = useState(false);
  const isSecret = !!secureTextEntry;

  return (
    <View style={styles.row}>
      <View style={styles.icon}>
        <Symbol name={icon} size={17} color={appleLight.secondaryLabel} />
      </View>
      <TextInput
        ref={ref}
        {...rest}
        secureTextEntry={isSecret && !revealed}
        placeholderTextColor={appleLight.placeholder}
        selectionColor={appleLight.label}
        style={[styles.input, style]}
      />
      {isSecret && (
        <Pressable
          onPress={() => setRevealed((v) => !v)}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={revealed ? hideLabel : showLabel}
          style={styles.reveal}
        >
          <Symbol name={revealed ? 'eyeSlash' : 'eye'} size={17} color={appleLight.secondaryLabel} />
        </Pressable>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  group: {
    backgroundColor: appleLight.surface,
    borderRadius: radii.group,
    overflow: 'hidden',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: appleLight.separator,
    marginLeft: ICON_COLUMN,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingRight: 14,
  },
  icon: {
    width: ICON_COLUMN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    ...typography.body,
    color: appleLight.label,
    paddingVertical: 14,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  reveal: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
