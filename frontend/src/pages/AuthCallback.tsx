import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '../lib/api';
import { AUTH_KEY } from '../hooks/useAuth';

export default function AuthCallback() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      // Store token in cookie via API call
      document.cookie = `access_token=${token}; path=/; max-age=86400; SameSite=None; Secure`;
      // Fetch user and update auth state
      authApi.me().then((user) => {
        queryClient.setQueryData(AUTH_KEY, user);
        navigate('/dashboard', { replace: true });
      }).catch(() => navigate('/login', { replace: true }));
    } else {
      navigate('/login', { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D1117]">
      <p className="text-white">Signing you in...</p>
    </div>
  );
}
