import { apiClient } from './client';
import {
  AuthSession,
  LoginCredentials,
  RegisterCredentials,
  ForgotPasswordInput,
  ResetPasswordInput,
  CreateStaffInput,
  User,
} from '@/types/auth';

export const authApi = {
  async getSession(): Promise<AuthSession> {
    const res = await apiClient<AuthSession>('/auth/session', {
      method: 'GET',
    });
    return res.data;
  },

  async login(credentials: LoginCredentials): Promise<User> {
    const res = await apiClient<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return res.data.user;
  },

  async register(data: RegisterCredentials): Promise<User> {
    const res = await apiClient<{ user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data.user;
  },

  async logout(): Promise<void> {
    await apiClient<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  },

  async forgotPassword(data: ForgotPasswordInput): Promise<{ message: string }> {
    const res = await apiClient<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async resetPassword(data: ResetPasswordInput): Promise<{ message: string }> {
    const res = await apiClient<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async createStaffAccount(data: CreateStaffInput): Promise<User> {
    const res = await apiClient<{ user: User }>('/admin/users/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data.user;
  },

  async listStaffAccounts(): Promise<User[]> {
    const res = await apiClient<User[]>('/admin/users/staff', {
      method: 'GET',
    });
    return res.data;
  },
};

