import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, DatabaseStatus } from '../types/marine.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  dbStatus: DatabaseStatus | null;
  refreshDbStatus: () => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  quickLogin: (asRole: UserRole) => Promise<void>;
  logout: () => void;
  updateUserContext: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);

  const fetchDbStatus = async () => {
    try {
      const status = await api.getDatabaseStatus();
      setDbStatus(status);
    } catch (e) {
      console.warn('Could not fetch DB status:', e);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = api.getToken();
        if (token) {
          const res = await api.getMe();
          setUser(res.user);
        }
      } catch (err) {
        console.warn('Session expired or invalid, clearing token');
        api.logout();
        setUser(null);
      } finally {
        setIsLoading(false);
        fetchDbStatus();
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, pass);
      setUser(res.user);
      await fetchDbStatus();
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (asRole: UserRole) => {
    if (asRole === 'admin') {
      await login('admin@nautica.marine', 'admin123');
    } else {
      await login('manager@nautica.marine', 'manager123');
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  const updateUserContext = (updated: User) => {
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        dbStatus,
        refreshDbStatus: fetchDbStatus,
        login,
        quickLogin,
        logout,
        updateUserContext
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
