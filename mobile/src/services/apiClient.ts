/* eslint-disable import/no-named-as-default-member */
import axios from 'axios';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

const isAndroidEmulator = (): boolean => {
  if (Platform.OS !== 'android') return false;
  if (Device.isDevice === false) return true;
  const c: any = Platform.constants || {};
  const brand = String(c.Brand || '').toLowerCase();
  const model = String(c.Model || '').toLowerCase();
  const fingerprint = String(c.Fingerprint || '').toLowerCase();
  const hardware = String(c.Hardware || '').toLowerCase();
  const product = String(c.Product || '').toLowerCase();
  return (
    (brand.includes('google') && (model.includes('sdk') || model.includes('emulator'))) ||
    model.includes('emulator') ||
    model.includes('simulator') ||
    fingerprint.includes('generic') ||
    fingerprint.includes('vbox') ||
    hardware.includes('goldfish') ||
    hardware.includes('ranchu') ||
    product.includes('sdk') ||
    product.includes('emulator')
  );
};

// URL de producción desplegada en Render
export const PRODUCTION_API_URL = 'https://lurifycase.onrender.com/api/v1';
const LAN_IP = '192.168.1.4';

const getInitialBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    if (isAndroidEmulator() && (envUrl.includes(LAN_IP) || envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
      return 'http://10.0.2.2:8080/api/v1';
    }
    return envUrl;
  }
  // Por defecto apunta directamente al backend de producción en Render
  return PRODUCTION_API_URL;
};

let currentBaseUrl = getInitialBaseUrl();
let accessToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

/** Called by the auth layer whenever the session token changes (FR-008). */
export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/** Registers a callback fired when the API answers 401 on an authenticated call. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

export const apiClient = axios.create({
  baseURL: currentBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

apiClient.interceptors.request.use(
  (config) => {
    config.baseURL = currentBaseUrl;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config;
    // Si falla por red (sin respuesta) en Android con URL local, intentar con la IP alterna (10.0.2.2 <-> LAN_IP)
    if (config && !config._retried && !error?.response && Platform.OS === 'android') {
      if (currentBaseUrl.includes('10.0.2.2') || currentBaseUrl.includes(LAN_IP)) {
        config._retried = true;
        const fallbackUrl = currentBaseUrl.includes('10.0.2.2')
          ? currentBaseUrl.replace('10.0.2.2', LAN_IP)
          : currentBaseUrl.replace(LAN_IP, '10.0.2.2');

        try {
          config.baseURL = fallbackUrl;
          currentBaseUrl = fallbackUrl;
          return await axios.request(config);
        } catch (retryError) {
          return Promise.reject(retryError);
        }
      }
    }

    const isAuth = typeof error?.config?.url === 'string' && error.config.url.includes('/auth/');
    if (error?.response?.status === 401 && !isAuth && unauthorizedHandler) {
      unauthorizedHandler();
    }
    return Promise.reject(error);
  }
);
