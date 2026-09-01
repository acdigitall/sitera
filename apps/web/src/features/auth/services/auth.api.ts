import { apiClient, tokenStorage } from '../../../services/api-client';
import { LoginDto, AuthResponse, AuthUser } from '@sitera/shared';

export const authApi = {
  login: async (dto: LoginDto): Promise<AuthResponse> => {
    const data = await apiClient<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    tokenStorage.set(data.token);
    return data;
  },

  getMe: async (): Promise<AuthUser> => {
    return await apiClient<AuthUser>('/auth/me');
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient<{ loggedOut: boolean }>('/auth/logout', {
        method: 'POST',
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      tokenStorage.remove();
    }
  },
};
