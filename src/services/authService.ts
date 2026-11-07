import { apiClient } from './apiClient';
import { AuthTokenResponse, LoginRequest, RegisterRequest } from '../types/api.types';

export const authService = {
  /** POST /auth/login (FR-008). */
  login: async (credentials: LoginRequest): Promise<AuthTokenResponse> => {
    const response = await apiClient.post<AuthTokenResponse>('/auth/login', credentials);
    return response.data;
  },

  /** POST /auth/register */
  register: async (payload: RegisterRequest): Promise<AuthTokenResponse> => {
    const response = await apiClient.post<any>('/auth/register', payload);
    if (response.data && response.data.accessToken) {
      return response.data as AuthTokenResponse;
    }
    return await authService.login({
      email: payload.email,
      password: payload.password,
    });
  },
};
