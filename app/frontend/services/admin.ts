import api from '@/lib/api';
import { User, UserRole } from '@/types/auth';

export interface DashboardData {
  stats: {
    db_status: boolean;
    last_backup: string;
    total_users: number;
    active_tasks: number;
  };
  chart_data: {
    name: string;
    value: number;
  }[];
}

export const getDashboardStats = async () => {
  const response = await api.get<DashboardData>('/admin/stats');
  return response.data;
};

export const getSystemLogs = async (limit: number = 50) => {
  const response = await api.get<string[]>('/admin/logs', { params: { limit } });
  return response.data;
};

export const clearSystemLogs = async () => {
  return await api.delete('/admin/logs/clear');
};

export const getAdminUsers = async () => {
  const response = await api.get<User[]>('/admin/users');
  return response.data;
};

export const updateUserRole = async (userId: number, role: UserRole) => {
  return await api.patch(`/admin/users/${userId}/role`, null, {
    params: { role }
  });
};

export interface UserUpdate {
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: UserRole;
  is_active?: boolean;
}

export const updateUser = async (userId: number, data: UserUpdate) => {
  return await api.patch<User>(`/admin/users/${userId}`, data);
}

export const deleteUser = async (userId: number) => {
  return await api.delete(`/admin/users/${userId}`);
}

export interface Analysis {
  id: number;
  place_name: string;
  score: number;
  summary: any;
  created_at: string;
}

export const getAnalyses = async (limit: number = 50) => {
  const res = await api.get<Analysis[]>('/admin/analyses', { params: { limit } });
  return res.data;
}

export const deleteAnalysis = async (id: number) => {
  return await api.delete(`/admin/analyses/${id}`);
}

export const executeSql = async (query: string) => {
  return await api.post('/admin/sql', { query });
}