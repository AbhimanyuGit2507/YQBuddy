import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { fetchApi } from '../lib/api';

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
    // Quick escape for public pages
    const publicPages = ['/login', '/register', '/'];
    // We want to try to fetch me on the landing page too if we want to show Dashboard,
    // so we shouldn't immediately return if it's the landing page.
    
    fetchApi('/auth/me')
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
      });
  }, [router.pathname]);

  const logout = async () => {
    try {
      await fetchApi('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error', e);
    }
    setUser(null);
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
