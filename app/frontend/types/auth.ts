export type UserRole = 'ADMIN' | 'USER' | 'SERVICE';


export interface User {
  id: number;
  first_name: string;
  last_name?: string;
  email: string;
  role: UserRole;
  created_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  first_name: string;
  last_name?: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}
