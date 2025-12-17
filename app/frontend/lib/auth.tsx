'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { setCookie, deleteCookie, getCookie } from 'cookies-next';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';
import { login as loginService, register as registerService } from '@/services/auth';
import { LoginCredentials, RegisterData, User } from '@/types/auth';
import api from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getCookie('access_token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token as string);
        const storedUser = localStorage.getItem('user_info');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          setUser({ email: decoded.sub, id: 0, first_name: 'User', role: 'USER' });
        }
      } catch (e) {
        console.error('Invalid token', e);
        deleteCookie('access_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {

    const data = await loginService(credentials);
    setCookie('access_token', data.access_token);

    try {
      const userResponse = await api.get<User>('/users/me');
      const userData = userResponse.data;

      setUser(userData);
      localStorage.setItem('user_info', JSON.stringify(userData));

      if (userData.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/profile');
      }
    } catch (error) {
      console.error("Failed to fetch user info", error);
    }
  };

  const register = async (data: RegisterData) => {
    const newUser = await registerService(data);
    await login({ email: data.email, password: data.password });

    setUser(newUser);
    localStorage.setItem('user_info', JSON.stringify(newUser));
  };

  const logout = () => {
    deleteCookie('access_token');
    localStorage.removeItem('user_info');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
