import React, { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/api/authApi';
import {
  User,
  LoginCredentials,
  RegisterCredentials,
  ForgotPasswordInput,
  ResetPasswordInput,
  CreateStaffInput,
} from '@/types/auth';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (data: RegisterCredentials) => Promise<User>;
  logout: () => Promise<void>;
  forgotPassword: (data: ForgotPasswordInput) => Promise<{ message: string }>;
  resetPassword: (data: ResetPasswordInput) => Promise<{ message: string }>;
  createStaffAccount: (data: CreateStaffInput) => Promise<User>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient();

  // Query server for in-memory session (backed by HTTP-only cookie)
  const { data: session, isLoading } = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: () => authApi.getSession(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });

  const user = session?.user ?? null;
  const isAuthenticated = Boolean(session?.isAuthenticated && user);

  // Login Mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (newUser) => {
      queryClient.setQueryData(['auth', 'session'], {
        user: newUser,
        isAuthenticated: true,
      });
    },
  });

  // Register Mutation
  const registerMutation = useMutation({
    mutationFn: (data: RegisterCredentials) => authApi.register(data),
    onSuccess: (newUser) => {
      queryClient.setQueryData(['auth', 'session'], {
        user: newUser,
        isAuthenticated: true,
      });
      // Invalidate outbox query so newly logged welcome email is immediately available
      queryClient.invalidateQueries({ queryKey: ['outbox'] });
    },
  });

  // Logout Mutation
  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'session'], {
        user: null,
        isAuthenticated: false,
      });
      queryClient.clear();
    },
  });

  // Staff Creation Mutation (ADMIN only)
  const staffMutation = useMutation({
    mutationFn: (data: CreateStaffInput) => authApi.createStaffAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] });
      queryClient.invalidateQueries({ queryKey: ['outbox'] });
    },
  });

  const value: AuthContextValue = {
    user,
    isAuthenticated,
    isLoading,
    login: (credentials) => loginMutation.mutateAsync(credentials),
    register: (data) => registerMutation.mutateAsync(data),
    logout: () => logoutMutation.mutateAsync(),
    forgotPassword: (data) => authApi.forgotPassword(data),
    resetPassword: (data) => authApi.resetPassword(data),
    createStaffAccount: (data) => staffMutation.mutateAsync(data),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

