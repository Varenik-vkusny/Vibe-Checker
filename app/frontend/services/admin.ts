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