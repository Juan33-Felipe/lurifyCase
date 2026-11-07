/* eslint-disable import/no-named-as-default-member */
import axios from 'axios';
import { Platform } from 'react-native';

// Dispositivo físico → IP LAN de la PC. Emulador Android → 10.0.2.2. Web/iOS Sim → localhost.
const LAN_IP = '192.168.1.4';
const DEFAULT_BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost:8080/api/v1'
    : `http://${LAN_IP}:8080/api/v1`;
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
    const isAuth = typeof error?.config?.url === 'string' && error.config.url.includes('/auth/');
    if (error?.response?.status === 401 && !isAuth && unauthorizedHandler) {
      unauthorizedHandler();
    }
    return Promise.reject(error);
  }
);
