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
