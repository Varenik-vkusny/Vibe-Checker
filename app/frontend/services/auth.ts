import api from '@/lib/api';
import { LoginCredentials, RegisterData, AuthResponse, User } from '@/types/auth';

export const login = async (credentials: LoginCredentials) => {
  const formData = new FormData();
  formData.append('username', credentials.email);
  formData.append('password', credentials.password);
  
  const response = await api.post<AuthResponse>('/users/token', formData, {
      headers: { 'Content-Type': 'multipart/form-data' } 
  });
  return response.data;
};

export const register = async (data: RegisterData) => {
  const response = await api.post<User>('/users/', data);
  return response.data;
};

export const deleteUser = async () => {
  const token = localStorage.getItem('access_token');
  return await api.delete('/users/', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

