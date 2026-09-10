/**
 * Sitera Centralized API Client
 * Manages HTTP requests, Bearer Token injection, and Multi-Tenant x-group-id headers.
 */

const API_BASE = '/api';
const TOKEN_KEY = 'sitera_auth_token';
const USER_KEY = 'sitera_auth_user';

export const tokenStorage = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Ignore storage errors in restricted contexts
    }
  },
  remove: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Ignore
    }
  },
};

export const userStorage = {
  get: <T>(): T | null => {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  set: <T>(user: T): void => {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      // Ignore
    }
  },
  remove: (): void => {
    try {
      localStorage.removeItem(USER_KEY);
    } catch {
      // Ignore
    }
  },
};

export interface RequestOptions extends RequestInit {
  groupId?: string | null;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { groupId, headers: customHeaders, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Inject Authorization Bearer Token if available
  const token = tokenStorage.get();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Inject PostgreSQL RLS Tenant Header if provided
  if (groupId) {
    headers['x-group-id'] = groupId;
  }

  // Inject User Role & ID from userStorage if available
  const currentUser = userStorage.get<{ id?: string; role?: string }>();
  if (currentUser?.role) {
    headers['x-user-role'] = currentUser.role;
  }
  if (currentUser?.id) {
    headers['x-user-id'] = currentUser.id;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers: {
      ...headers,
      ...(customHeaders as Record<string, string>),
    },
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok || json.success === false) {
    if (response.status === 401) {
      tokenStorage.remove();
      userStorage.remove();
    }
    const message = json.message || `İstek başarısız oldu (HTTP ${response.status})`;
    throw new Error(message);
  }

  return (json.data !== undefined ? json.data : json) as T;
}
