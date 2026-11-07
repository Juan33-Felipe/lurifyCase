import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types/api.types';

const SESSION_KEY = 'lurify.session';

export interface StoredSession {
  accessToken: string;
  /** Epoch millis computed from the relative `expiresIn` at login time. */
  expiresAt: number;
  user: UserProfile;
}

// SecureStore (Keychain / Keystore) on native; AsyncStorage fallback on web.
const useSecure = Platform.OS !== 'web';

export const sessionStorage = {
  save: async (session: StoredSession): Promise<void> => {
    const raw = JSON.stringify(session);
    if (useSecure) await SecureStore.setItemAsync(SESSION_KEY, raw);
    else await AsyncStorage.setItem(SESSION_KEY, raw);
  },

  load: async (): Promise<StoredSession | null> => {
    try {
      const raw = useSecure
        ? await SecureStore.getItemAsync(SESSION_KEY)
        : await AsyncStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as StoredSession;
      if (!session.accessToken || session.expiresAt <= Date.now()) {
        await sessionStorage.clear();
        return null;
      }
      return session;
    } catch {
      return null;
    }
  },

  clear: async (): Promise<void> => {
    try {
      if (useSecure) await SecureStore.deleteItemAsync(SESSION_KEY);
      else await AsyncStorage.removeItem(SESSION_KEY);
    } catch {
      // Nothing to clear.
    }
  },
};
