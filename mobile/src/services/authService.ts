import { apiClient } from './apiClient';
import { AuthTokenResponse, LoginRequest } from '../types/api.types';

export const authService = {
  /** POST /auth/login (FR-008). */
  login: async (credentials: LoginRequest): Promise<AuthTokenResponse> => {
    const response = await apiClient.post<AuthTokenResponse>('/auth/login', credentials);
    return response.data;
  },
};
