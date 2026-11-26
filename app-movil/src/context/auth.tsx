import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AuthApi } from '../api/endpoints';
import { setToken, setUnauthorizedHandler, tokenStorage } from '../api/client';
import type { RolSlug, Usuario } from '../api/types';

interface AuthState {
  user: Usuario | null;
  loading: boolean; // restaurando sesión al abrir la app
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: RolSlug[]) => boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(async () => {
    setToken(null);
    setUser(null);
    await tokenStorage.clear();
  }, []);

  // Restaurar la sesión guardada y validar el token con /me.
  useEffect(() => {
    setUnauthorizedHandler(() => void clearSession());
    (async () => {
      try {
        const saved = await tokenStorage.get();
        if (saved) {
          setToken(saved);
          setUser(await AuthApi.me());
        }
      } catch {
        await clearSession();
      } finally {
        setLoading(false);
      }
    })();
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await AuthApi.login(email, password);
    setToken(res.token);
    await tokenStorage.set(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await AuthApi.logout();
    } catch {
      // Aunque falle la red, se cierra la sesión local.
    }
    await clearSession();
  }, [clearSession]);

  const hasRole = useCallback(
    (...roles: RolSlug[]) => !!user && roles.includes(user.rol.slug),
    [user],
  );

  const value = useMemo(
    () => ({ user, loading, login, logout, hasRole }),
    [user, loading, login, logout, hasRole],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
