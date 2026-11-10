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
  arrowLeft: { ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' },
  plus: { ios: 'plus', android: 'add', web: 'add' },
  error: { ios: 'exclamationmark.circle', android: 'error', web: 'error' },
  brand: { ios: 'building.columns', android: 'account_balance', web: 'account_balance' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  clear: { ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' },
  filter: { ios: 'slider.horizontal.3', android: 'tune', web: 'tune' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  chevronLeft: { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' },
  chevronDown: { ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' },
  chevronUp: { ios: 'chevron.up', android: 'keyboard_arrow_up', web: 'keyboard_arrow_up' },
  calendar: { ios: 'calendar', android: 'calendar_today', web: 'calendar_today' },
  calendarBadgePlus: { ios: 'calendar.badge.plus', android: 'event', web: 'event' },
  clock: { ios: 'clock', android: 'schedule', web: 'schedule' },
  trash: { ios: 'trash', android: 'delete', web: 'delete' },
  flag: { ios: 'flag.fill', android: 'flag', web: 'flag' },
  notes: { ios: 'note.text', android: 'notes', web: 'notes' },
  checkmark: { ios: 'checkmark', android: 'check', web: 'check' },
  folder: { ios: 'folder', android: 'folder', web: 'folder' },
  folderOpen: { ios: 'folder.badge.plus', android: 'create_new_folder', web: 'create_new_folder' },
  doc: { ios: 'doc.text', android: 'description', web: 'description' },
  gavel: { ios: 'hammer', android: 'gavel', web: 'gavel' },
  shield: { ios: 'shield.lefthalf.filled', android: 'verified_user', web: 'verified_user' },
  warning: { ios: 'exclamationmark.triangle', android: 'warning', web: 'warning' },
  translate: { ios: 'translate', android: 'translate', web: 'translate' },
  sparkles: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
  home: { ios: 'house.fill', android: 'home', web: 'home' },
  bell: { ios: 'bell.fill', android: 'notifications', web: 'notifications' },
  settings: { ios: 'gearshape.fill', android: 'settings', web: 'settings' },
  mic: { ios: 'mic.fill', android: 'mic', web: 'mic' },
  micSlash: { ios: 'mic.slash.fill', android: 'mic_off', web: 'mic_off' },
  stop: { ios: 'stop.fill', android: 'stop', web: 'stop' },
  refresh: { ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' },
  edit: { ios: 'square.and.pencil', android: 'edit', web: 'edit' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  fingerprint: { ios: 'touchid', android: 'fingerprint', web: 'fingerprint' },
  logout: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' },
  tag: { ios: 'number', android: 'tag', web: 'tag' },
  pushPin: { ios: 'pin.fill', android: 'push_pin', web: 'push_pin' },
  book: { ios: 'book.fill', android: 'menu_book', web: 'menu_book' },
  send: { ios: 'paperplane.fill', android: 'send', web: 'send' },
  lightMode: { ios: 'sun.max.fill', android: 'light_mode', web: 'light_mode' },
  darkMode: { ios: 'moon.fill', android: 'dark_mode', web: 'dark_mode' },
  globe: { ios: 'globe', android: 'language', web: 'language' },
  play: { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' },
  pause: { ios: 'pause.fill', android: 'pause', web: 'pause' },
  waveform: { ios: 'waveform', android: 'graphic_eq', web: 'graphic_eq' },
  volume: { ios: 'speaker.wave.2.fill', android: 'volume_up', web: 'volume_up' },
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
