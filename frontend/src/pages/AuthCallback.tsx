import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AUTH_KEY } from '../hooks/useAuth';
import api from '../lib/axios';

export default function AuthCallback() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    // Set cookie first
    document.cookie = `access_token=${token}; path=/; max-age=86400; SameSite=None; Secure`;
    // Wait one tick for browser to register cookie, then fetch user
    setTimeout(() => {
      api.get('/auth/me')
        .then((res) => {
          queryClient.setQueryData(AUTH_KEY, res.data);
          navigate('/dashboard', { replace: true });
        })
        .catch(() => navigate('/login', { replace: true }));
    }, 100);
  }, [navigate, queryClient]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D1117]">
      <p className="text-white text-lg">Signing you in with Google...</p>
    </div>
  );
}
