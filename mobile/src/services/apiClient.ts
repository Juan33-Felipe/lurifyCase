import axios from 'axios';
import { Platform } from 'react-native';

// Fallback: 10.0.2.2 para Android Emulator, localhost para iOS Simulator / Web.
const isAndroid = Platform.OS === 'android';
const DEFAULT_BASE_URL = isAndroid ? 'http://10.0.2.2:8080/api/v1' : 'http://localhost:8080/api/v1';
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_BASE_URL;

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
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

apiClient.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLogin = typeof error?.config?.url === 'string' && error.config.url.includes('/auth/login');
    if (error?.response?.status === 401 && !isLogin && unauthorizedHandler) {
      unauthorizedHandler();
    }
    return Promise.reject(error);
  }
);
