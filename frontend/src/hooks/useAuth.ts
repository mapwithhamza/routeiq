/**
 * src/hooks/useAuth.ts — Auth state management via TanStack Query v5.
 * Fetches /auth/me on mount; all pages call this to read auth state.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authApi } from '../lib/api';
import type { LoginRequest, RegisterRequest } from '../types';

export const AUTH_KEY = ['auth', 'me'] as const;

/** Returns the current user (or null if not logged in). */
export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: AUTH_KEY,
    queryFn: authApi.me,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 min
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (u) => {
      queryClient.setQueryData(AUTH_KEY, u);
      toast.success(`Welcome back, ${u.email}!`);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? 'Login failed. Check your credentials.';
      toast.error(msg);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (u) => {
      queryClient.setQueryData(AUTH_KEY, u);
      toast.success('Account created! Welcome to RouteIQ.');
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? 'Registration failed.';
      toast.error(msg);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      queryClient.setQueryData(AUTH_KEY, null);
      queryClient.clear();
      toast.info('Logged out.');
    },
  });

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    logout: logoutMutation.mutate,
  };
}
