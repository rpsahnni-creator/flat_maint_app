import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api, clearTokens, getAccessToken, setTokens } from '@/lib/api';
import type { Role } from '@/types';

export type AuthUser = {
  id: number;
  email: string;
  display_name?: string;
  app_role: Role;
};

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  email: string;
  setEmail: (email: string) => void;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  requestOTP: (email: string) => Promise<{ demo_code?: string }>;
  verifyOTP: (email: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  const loadMe = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      return;
    }
    const { data } = await api.get('/auth/me/');
    setUser({
      id: data.id,
      email: data.email,
      display_name: data.display_name,
      app_role: data.app_role === 'admin' ? 'admin' : 'resident',
    });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await loadMe();
      } catch {
        clearTokens();
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadMe]);

  const signInWithPassword = useCallback(async (userEmail: string, password: string) => {
    setError(null);
    const { data } = await api.post('/auth/token/', { email: userEmail, password });
    setTokens(data.access, data.refresh);
    await loadMe();
  }, [loadMe]);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    const { data } = await api.post('/auth/google/', {
      id_token: 'demo-google-token',
    });
    setTokens(data.access, data.refresh);
    await loadMe();
  }, [loadMe]);

  const requestOTP = useCallback(async (userEmail: string) => {
    setError(null);
    setEmail(userEmail);
    const { data } = await api.post('/auth/otp/request/', { email: userEmail });
    return data as { demo_code?: string };
  }, []);

  const verifyOTP = useCallback(async (userEmail: string, token: string) => {
    setError(null);
    const { data } = await api.post('/auth/otp/verify/', { email: userEmail, otp: token });
    setTokens(data.access, data.refresh);
    await loadMe();
  }, [loadMe]);

  const signOut = useCallback(async () => {
    try {
      const refresh = localStorage.getItem('gv_refresh_token');
      if (refresh) {
        await api.post('/auth/logout/', { refresh });
      }
    } catch {
      // ignore logout API errors
    } finally {
      clearTokens();
      setUser(null);
      setEmail('');
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        email,
        setEmail,
        signInWithPassword,
        signInWithGoogle,
        requestOTP,
        verifyOTP,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
