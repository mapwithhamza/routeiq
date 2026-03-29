/**
 * src/pages/Register.tsx — Phase 12 (UI Redesign)
 * Centered card, cyan accent, scaleIn animation.
 * React Hook Form + Zod validation. Calls POST /auth/register.
 * On success: redirects to /dashboard. On error: Sonner toast.
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Truck, UserPlus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { registerSchema, type RegisterForm } from '../schemas';

export default function Register() {
  const { register: registerUser, isRegistering, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  // If already authenticated skip registration screen
  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerUser(data);
      navigate('/dashboard', { replace: true });
    } catch {
      // Toast already shown by useAuth's onError handler
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0D1117] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-scale-in">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-xl shadow-indigo-500/20 mb-4">
            <Truck size={26} className="text-white" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-slate-100">
            Route<span className="text-cyan-500 dark:text-cyan-400">IQ</span>
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">Create your dispatcher account</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/80 backdrop-blur-sm px-8 py-9 shadow-2xl">
          <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-slate-100">
            Create an account
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Email address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                <input
                  id="reg-email"
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
              <label htmlFor="reg-password" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                <input
                  id="reg-password"
                  type="password"
                  autoComplete="new-password"
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
              <p className="mt-1.5 text-xs text-gray-500 dark:text-slate-600">
                Min 8 chars, one uppercase, one number.
              </p>
            </div>

            {/* Submit */}
            <button
              id="btn-register"
              type="submit"
              disabled={isRegistering}
              className="mt-1 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 shadow-lg shadow-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UserPlus size={15} />
              {isRegistering ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-cyan-400 hover:text-cyan-300 transition">
              Sign in
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
