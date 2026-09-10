import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, LoginDto } from '@sitera/shared';
import { authApi } from '../services/auth.api';
import { tokenStorage, userStorage } from '../../../services/api-client';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  selectedUnit: string | null;
  setSelectedUnit: (unit: string | null) => void;
  login: (dto: LoginDto) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateUser: (updatedUser: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => userStorage.get<AuthUser>());
  const [token, setToken] = useState<string | null>(() => tokenStorage.get());
  // If we already have a cached token and user, do not block with full screen spinner
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const hasToken = !!tokenStorage.get();
    const hasUser = !!userStorage.get<AuthUser>();
    return hasToken && !hasUser;
  });
  const [error, setError] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnitState] = useState<string | null>(() => {
    if (typeof window === 'undefined') return 'all';
    return localStorage.getItem('sitera:selected_unit') || 'all';
  });

  const setSelectedUnit = (unit: string | null) => {
    setSelectedUnitState(unit);
    if (typeof window !== 'undefined') {
      if (unit) {
        localStorage.setItem('sitera:selected_unit', unit);
      } else {
        localStorage.removeItem('sitera:selected_unit');
      }
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = tokenStorage.get();
      if (!storedToken) {
        tokenStorage.remove();
        userStorage.remove();
        setUser(null);
        setToken(null);
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await authApi.getMe();
        setUser(currentUser);
        setToken(storedToken);
        userStorage.set(currentUser);

        // If user has only 1 unit and no specific choice was made, set to that unit
        if (currentUser?.units && currentUser.units.length === 1) {
          setSelectedUnit(currentUser.units[0]);
        }
      } catch (err: any) {
        const errMsg = String(err?.message || '');
        const isAuthFailure =
          errMsg.includes('401') ||
          errMsg.includes('Geçersiz') ||
          errMsg.includes('süresi dolmuş') ||
          errMsg.includes('Oturum bulunamadı') ||
          errMsg.includes('aktif değil');

        if (isAuthFailure) {
          tokenStorage.remove();
          userStorage.remove();
          setUser(null);
          setToken(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (dto: LoginDto) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.login(dto);
      setUser(response.user);
      setToken(response.token);
      userStorage.set(response.user);
      tokenStorage.set(response.token);

      if (response.user?.units && response.user.units.length === 1) {
        setSelectedUnit(response.user.units[0]);
      } else if (response.user?.units && response.user.units.length > 1) {
        setSelectedUnit('all');
      }
    } catch (err: any) {
      setError(err.message || 'Giriş yapılamadı');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } finally {
      tokenStorage.remove();
      userStorage.remove();
      setUser(null);
      setToken(null);
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  const updateUser = (updated: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updated };
      userStorage.set(next);
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        error,
        selectedUnit,
        setSelectedUnit,
        login,
        logout,
        clearError,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
