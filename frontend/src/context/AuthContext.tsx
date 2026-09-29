import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';

export interface User {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
  role?: string;
  getIdToken: () => Promise<string>;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore stored session on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('qxlabs_token');
      const storedUser = localStorage.getItem('qxlabs_user');
      if (storedToken && storedUser) {
        const parsed = JSON.parse(storedUser);
        const userObj: User = {
          uid: parsed.uid || parsed.id,
          email: parsed.email,
          displayName: parsed.full_name || parsed.displayName || parsed.email.split('@')[0],
          role: parsed.role || 'learner',
          getIdToken: async () => storedToken,
        };
        setCurrentUser(userObj);
      }
    } catch (e) {
      console.error('Failed to parse cached auth state:', e);
      localStorage.removeItem('qxlabs_token');
      localStorage.removeItem('qxlabs_user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const res = await apiClient.post('/api/v1/auth/login', {
        email,
        password: pass,
      }, { timeout: 6000 });
      const { token, user } = res.data;
      localStorage.setItem('qxlabs_token', token);
      localStorage.setItem('qxlabs_user', JSON.stringify(user));

      const userObj: User = {
        uid: user.uid || user.id,
        email: user.email,
        displayName: user.full_name || user.email.split('@')[0],
        role: user.role || 'learner',
        getIdToken: async () => token,
      };
      setCurrentUser(userObj);
    } catch (err: any) {
      // If demo credentials and backend is unreachable/delayed, log in instantly
      if (email.toLowerCase().trim() === 'demo@qxlabs.ai') {
        console.warn('Backend unavailable, activating instant local demo session');
        const demoToken = 'qxlabs-demo-bearer-token-2026';
        const demoUser = {
          id: 'demo_user',
          uid: 'demo_user',
          email: 'demo@qxlabs.ai',
          full_name: 'Quantum Explorer',
          role: 'learner'
        };
        localStorage.setItem('qxlabs_token', demoToken);
        localStorage.setItem('qxlabs_user', JSON.stringify(demoUser));
        const userObj: User = {
          uid: 'demo_user',
          email: 'demo@qxlabs.ai',
          displayName: 'Quantum Explorer',
          role: 'learner',
          getIdToken: async () => demoToken,
        };
        setCurrentUser(userObj);
        return;
      }
      throw err;
    }
  };

  const register = async (email: string, pass: string, name: string) => {
    try {
      const res = await apiClient.post('/api/v1/auth/register', {
        email,
        password: pass,
        full_name: name,
      }, { timeout: 6000 });
      const { token, user } = res.data;
      localStorage.setItem('qxlabs_token', token);
      localStorage.setItem('qxlabs_user', JSON.stringify(user));

      const userObj: User = {
        uid: user.uid || user.id,
        email: user.email,
        displayName: user.full_name || user.email.split('@')[0],
        role: user.role || 'learner',
        getIdToken: async () => token,
      };
      setCurrentUser(userObj);
    } catch (err: any) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('qxlabs_token');
    localStorage.removeItem('qxlabs_user');
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
