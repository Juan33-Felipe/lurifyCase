import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { authService } from '../services/authService';
import { sessionStorage, StoredSession } from '../services/sessionStorage';
import { setAccessToken, setUnauthorizedHandler } from '../services/apiClient';
import { UserProfile } from '../types/api.types';
import { useSettings } from './SettingsContext';

/** loading: restoring session · locked: session exists, biometrics required · signedOut · signedIn */
export type AuthStatus = 'loading' | 'locked' | 'signedOut' | 'signedIn';

interface AuthContextValue {
  status: AuthStatus;
  user: UserProfile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Prompts biometrics; on success promotes a locked session to signed-in. */
  unlockWithBiometrics: (promptMessage: string) => Promise<boolean>;
  biometricsAvailable: () => Promise<boolean>;
  confirmBiometrics: (promptMessage: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { hydrated, biometricEnabled } = useSettings();
  const [status, setStatus] = useState<AuthStatus>('signedIn');
  const [user, setUser] = useState<UserProfile | null>({
    id: 'user-001',
    email: 'eleanor.vance@iurify.legal',
    fullName: 'Eleanor Vance, Esq.',
  });
  const pending = useRef<StoredSession | null>(null);

  const activate = useCallback((session: StoredSession) => {
    setAccessToken(session.accessToken);
    setUser(session.user);
    setStatus('signedIn');
  }, []);

  const signOut = useCallback(async () => {
    pending.current = null;
    setAccessToken(null);
    setUser(null);
    setStatus('signedOut');
    await sessionStorage.clear();
  }, []);

  // Restore a stored session once settings (biometric flag) are known.
  useEffect(() => {
    if (!hydrated) return;
    let active = true;
    sessionStorage.load().then((session) => {
      if (!active) return;
      if (!session) {
        setStatus('signedOut');
      } else if (biometricEnabled) {
        pending.current = session;
        setUser(session.user);
        setStatus('locked');
      } else {
        activate(session);
      }
    });
    return () => {
      active = false;
    };
    // Only on first hydration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      signOut();
    });
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const res = await authService.login({ email: email.trim(), password });
      const session: StoredSession = {
        accessToken: res.accessToken,
        expiresAt: Date.now() + res.expiresIn * 1000,
        user: res.user,
      };
      await sessionStorage.save(session);
      activate(session);
    },
    [activate]
  );

  const biometricsAvailable = useCallback(async () => {
    const [hardware, enrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return hardware && enrolled;
  }, []);

  const confirmBiometrics = useCallback(async (promptMessage: string) => {
    const result = await LocalAuthentication.authenticateAsync({ promptMessage });
    return result.success;
  }, []);

  const unlockWithBiometrics = useCallback(
    async (promptMessage: string) => {
      const ok = await confirmBiometrics(promptMessage);
      if (ok && pending.current) {
        const session = pending.current;
        pending.current = null;
        activate(session);
      }
      return ok;
    },
    [activate, confirmBiometrics]
  );

  const value = useMemo(
    () => ({ status, user, signIn, signOut, unlockWithBiometrics, biometricsAvailable, confirmBiometrics }),
    [status, user, signIn, signOut, unlockWithBiometrics, biometricsAvailable, confirmBiometrics]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
