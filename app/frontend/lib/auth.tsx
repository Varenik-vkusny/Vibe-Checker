'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { setCookie, deleteCookie, getCookie } from 'cookies-next';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';
import { login as loginService, register as registerService } from '@/services/auth';
import { LoginCredentials, RegisterData, User } from '@/types/auth';

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
    // Check for token on mount
    const token = getCookie('access_token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token as string);
        // We only get email from token, but we might have stored user info in localStorage
        const storedUser = localStorage.getItem('user_info');
        if (storedUser) {
           setUser(JSON.parse(storedUser));
        } else {
           // Fallback if we have token but no stored info
           setUser({ email: decoded.sub, id: 0, first_name: 'User' });
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
    
    // Decode to get email
    const decoded: any = jwtDecode(data.access_token);
    const newUser = { email: decoded.sub, id: 0, first_name: 'User' };
    
    // Try to recover user info from cache if email matches?
    // Or just set basic info.
    setUser(newUser);
    localStorage.setItem('user_info', JSON.stringify(newUser));
    
    router.push('/profile');
  };

  const register = async (data: RegisterData) => {
    const newUser = await registerService(data);
    // After register, we usually auto-login or ask to login.
    // Let's auto-login
    await login({ email: data.email, password: data.password });
    
    // Update user info with the real data from register response
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
