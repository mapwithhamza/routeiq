/**
 * src/pages/Login.tsx — Phase 12 (UI Redesign)
 * Centered card, cyan accent, scaleIn animation.
 * React Hook Form + Zod validation. Calls POST /auth/login.
 * On success: role-based redirect. On error: Sonner toast.
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Truck, LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { loginSchema, type LoginForm } from '../schemas';

export default function Login() {
  const { login, isLoggingIn, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  // If already authenticated, skip login screen
  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data: LoginForm) => {
    try {
      const user = await login(data);
      if (user.role === 'admin' || user.role === 'dispatcher') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch {
      // Toast is already shown by useAuth's onError handler
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0D1117] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-scale-in">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-xl shadow-cyan-500/25 mb-4">
            <Truck size={26} className="text-white" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-slate-100">
            Route<span className="text-cyan-500 dark:text-cyan-400">IQ</span>
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
            Delivery Route Optimization Dashboard
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/80 backdrop-blur-sm px-8 py-9 shadow-2xl">
          <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-slate-100">
            Sign in to your account
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Email address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900/60 border text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-600 outline-none transition focus:ring-2 focus:ring-cyan-500/50 ${
                    errors.email ? 'border-red-500/60' : 'border-gray-300 dark:border-slate-700/60'
                  }`}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register('password')}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900/60 border text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-600 outline-none transition focus:ring-2 focus:ring-cyan-500/50 ${
                    errors.password ? 'border-red-500/60' : 'border-gray-300 dark:border-slate-700/60'
                  }`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              id="btn-login"
              type="submit"
              disabled={isLoggingIn}
              className="mt-1 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 shadow-lg shadow-cyan-500/25 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogIn size={15} />
              {isLoggingIn ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-slate-700/60" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white dark:bg-slate-800/80 px-2 text-gray-500 dark:text-slate-400">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <a href={`${import.meta.env.VITE_API_URL}/auth/google`} className="w-full flex items-center justify-center gap-3 rounded-xl bg-white border border-gray-300 dark:border-slate-600 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-200">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </a>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-cyan-400 hover:text-cyan-300 transition">
              Create one
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400 dark:text-slate-600">
          © 2026 RouteIQ · Muhammad Hamza Khan · NUST IGIS
        </p>
      </div>
    </div>
  );
}
