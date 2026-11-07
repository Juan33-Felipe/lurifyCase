import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Palette, ThemeMode, palettes } from '../theme/theme';
import { Language, TranslationKey, translations } from '../i18n/translations';

const STORAGE_KEY = 'lurify.settings';

/** Defaults required by product: Light mode and English. */
const DEFAULTS = {
  theme: 'light' as ThemeMode,
  language: 'en' as Language,
  biometricEnabled: false,
  autoTranslate: true,
};

interface PersistedSettings {
  theme: ThemeMode;
  language: Language;
  biometricEnabled: boolean;
  autoTranslate: boolean;
}

interface SettingsContextValue extends PersistedSettings {
  hydrated: boolean;
  palette: Palette;
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (language: Language) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setAutoTranslate: (enabled: boolean) => void;
  t: (key: TranslationKey) => string;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PersistedSettings>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!active || !raw) return;
        const parsed = JSON.parse(raw) as Partial<PersistedSettings>;
        setSettings({
          theme: parsed.theme === 'dark' ? 'dark' : 'light',
          language: parsed.language === 'es' ? 'es' : 'en',
          biometricEnabled: parsed.biometricEnabled === true,
          autoTranslate: parsed.autoTranslate !== false,
        });
      })
      .catch(() => undefined)
      .finally(() => active && setHydrated(true));
    return () => {
      active = false;
    };
  }, []);

  const update = useCallback((patch: Partial<PersistedSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      ...settings,
      hydrated,
      palette: palettes[settings.theme],
      setTheme: (theme) => update({ theme }),
      setLanguage: (language) => update({ language }),
      setBiometricEnabled: (biometricEnabled) => update({ biometricEnabled }),
      setAutoTranslate: (autoTranslate) => update({ autoTranslate }),
      t: (key) => translations[settings.language][key],
    }),
    [settings, hydrated, update]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

export function useTheme(): Palette {
  return useSettings().palette;
}

export function useI18n() {
  const { t, language } = useSettings();
  return { t, language };
}
