/**
 * src/pages/Login.tsx — Login page.
 * React Hook Form + Zod validation. Calls POST /auth/login.
 * On success: role-based redirect. On error: Sonner toast.
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
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
      // Role-based redirect (both admin + dispatcher go to /dashboard for now)
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
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            Route<span className="text-indigo-400">IQ</span>
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Delivery Route Optimization Dashboard
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 px-8 py-10 shadow-2xl">
          <h2 className="mb-6 text-xl font-semibold text-white">Sign in to your account</h2>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-300">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className={`w-full rounded-lg bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 outline-none ring-1 transition focus:ring-2 focus:ring-indigo-500 ${
                  errors.email ? 'ring-red-500' : 'ring-gray-700'
                }`}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                className={`w-full rounded-lg bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 outline-none ring-1 transition focus:ring-2 focus:ring-indigo-500 ${
                  errors.password ? 'ring-red-500' : 'ring-gray-700'
                }`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              id="btn-login"
              type="submit"
              disabled={isLoggingIn}
              className="mt-2 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingIn ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Register link */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-indigo-400 hover:text-indigo-300 transition">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
