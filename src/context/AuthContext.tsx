import React, { createContext, useContext, useState, useEffect } from 'react';
import { subscribeToAuthState, logoutUser } from '../services/auth';
import type { AuthSession } from '../services/auth';
import { isFirebaseConfigured } from '../services/firebase';

interface AuthContextType {
  user: AuthSession | null;
  role: AuthSession['role'] | null;
  loading: boolean;
  isMock: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const isMock = !isFirebaseConfigured || import.meta.env.VITE_USE_MOCK_FIREBASE === 'true';

  useEffect(() => {
    // Safety timeout — if auth doesn't resolve in 5s (e.g. Firebase network hang), stop loading
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    const unsubscribe = subscribeToAuthState((session) => {
      clearTimeout(timeout);
      setUser(session);
      setLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const logout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const role = user?.role || null;

  return (
    <AuthContext.Provider value={{ user, role, loading, isMock, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
