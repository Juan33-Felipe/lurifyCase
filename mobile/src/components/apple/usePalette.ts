import { useSettings } from '../../context/SettingsContext';
import { appleDark, appleLight, ApplePalette } from './tokens';

/** Paleta del kit según el tema elegido en Ajustes. */
export function usePalette(): ApplePalette {
  const { theme } = useSettings();
  return theme === 'dark' ? appleDark : appleLight;
}
