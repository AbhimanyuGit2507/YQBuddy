import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { fetchApi, AuthStorage } from '../lib/api';

interface AuthContextType {
  user: any;
  loading: boolean;
  logout: () => void;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {},
  refetch: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const cookieMatch = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
    if (!cookieMatch) {
      setUser(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    fetchApi('/auth/me', { signal: controller.signal })
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        if (router.pathname.startsWith('/dashboard') || router.pathname.startsWith('/onboarding')) {
          router.push('/login');
        } else {
          setLoading(false);
        }
      })
      .finally(() => {
        clearTimeout(timeoutId);
      });

    return () => clearTimeout(timeoutId);
  }, [router.pathname]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'qmover_auth_token' && e.newValue === null) {
        setUser(null);
        router.push('/login');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router]);

  const logout = async () => {
    try {
      await fetchApi('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error', e);
    }
    setUser(null);
    AuthStorage.clear();
    router.push('/login');
  };

  const refetch = async () => {
    try {
      const data = await fetchApi('/auth/me');
      setUser(data);
    } catch {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refetch }}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-black">
          <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
