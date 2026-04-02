/**
 * src/pages/Login.tsx — Split layout login page
 * Left: form, Right: animated map visual
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Map, { Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { authApi } from '../lib/api';
import { AUTH_KEY } from '../hooks/useAuth';

const MAP_WAYPOINTS: [number, number][] = [
  [73.0800, 33.7100],
  [73.0750, 33.7150],
  [73.0650, 33.7180],
  [73.0550, 33.7160],
  [73.0480, 33.7100],
  [73.0450, 33.7020],
  [73.0480, 33.6940],
  [73.0550, 33.6900],
  [73.0650, 33.6880],
  [73.0750, 33.6920],
  [73.0800, 33.7000],
  [73.0780, 33.7060],
  [73.0700, 33.7080],
  [73.0600, 33.7060],
  [73.0520, 33.7000],
  [73.0500, 33.6940],
  [73.0540, 33.6900],
  [73.0620, 33.6890],
  [73.0700, 33.6920],
  [73.0760, 33.6980],
  [73.0800, 33.7060],
  [73.0800, 33.7100],
];

export default function Login() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [animProgress, setAnimProgress] = useState(0);
  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const ANIM_DURATION = 8000;

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      setAnimProgress((elapsed % ANIM_DURATION) / ANIM_DURATION);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  const totalPoints = MAP_WAYPOINTS.length - 1;
  const currentSegment = Math.floor(animProgress * totalPoints);
  const segmentProgress = (animProgress * totalPoints) - currentSegment;
  const animatedCoords: [number, number][] = [...MAP_WAYPOINTS.slice(0, currentSegment + 1)];
  if (currentSegment < totalPoints) {
    const from = MAP_WAYPOINTS[currentSegment];
    const to = MAP_WAYPOINTS[currentSegment + 1];
    animatedCoords.push([
      from[0] + (to[0] - from[0]) * segmentProgress,
      from[1] + (to[1] - from[1]) * segmentProgress,
    ]);
  }

  const routeGeoJSON = {
    type: 'Feature' as const,
    properties: {},
    geometry: { type: 'LineString' as const, coordinates: animatedCoords },
  };

  const dotGeoJSON = animatedCoords.length > 0 ? {
    type: 'Feature' as const,
    properties: {},
    geometry: { type: 'Point' as const, coordinates: animatedCoords[animatedCoords.length - 1] },
  } : null;

  const loginMut = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login({ email, password }),
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_KEY, data);
      navigate('/dashboard', { replace: true });
    },
    onError: () => toast.error('Invalid email or password'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill all fields'); return; }
    loginMut.mutate({ email, password });
  };

  const handleGoogle = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen flex bg-[#0A0A0A]">
      {/* Left — Form */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center px-8 sm:px-16 py-12">
        {/* Logo */}
        <div className="mb-12">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
              </svg>
            </div>
            <span className="text-base font-bold text-white">Route<span className="text-cyan-400">IQ</span></span>
          </button>
        </div>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-white/40 text-sm">Sign in to your RouteIQ account</p>
        </div>

        {/* Google Button */}
        <button
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-white/15 hover:border-white/30 hover:bg-white/5 text-white text-sm font-medium transition mb-6"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-white/30">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition"
            />
          </div>
          <button
            type="submit"
            disabled={loginMut.isPending}
            className="w-full py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loginMut.isPending ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Footer links */}
        <div className="mt-8 space-y-3">
          <p className="text-sm text-white/30 text-center">
            Don't have an account?{' '}
            <Link to="/register" className="text-cyan-400 hover:text-cyan-300 transition font-medium">
              Create one
            </Link>
          </p>
          <p className="text-center">
            <button onClick={() => navigate('/')} className="text-xs text-white/20 hover:text-white/50 transition">
              ← Back to Home
            </button>
          </p>
        </div>
      </div>

      {/* Right — Map Visual */}
      <div className="hidden lg:block flex-1 relative overflow-hidden">
        <Map
          initialViewState={{ longitude: 73.0630, latitude: 33.7030, zoom: 12 }}
          style={{ width: '100%', height: '100%' }}
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
          interactive={false}
        >
          <Source id="full-route" type="geojson" data={{
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: MAP_WAYPOINTS },
          }}>
            <Layer id="full-route-line" type="line"
              paint={{ 'line-color': '#ffffff', 'line-width': 1, 'line-opacity': 0.08 }}
              layout={{ 'line-join': 'round', 'line-cap': 'round' }}
            />
          </Source>

          <Source id="anim-route" type="geojson" data={routeGeoJSON}>
            <Layer id="anim-glow" type="line"
              paint={{ 'line-color': '#06b6d4', 'line-width': 10, 'line-opacity': 0.12 }}
              layout={{ 'line-join': 'round', 'line-cap': 'round' }}
            />
            <Layer id="anim-line" type="line"
              paint={{ 'line-color': '#06b6d4', 'line-width': 2, 'line-opacity': 0.8 }}
              layout={{ 'line-join': 'round', 'line-cap': 'round' }}
            />
          </Source>

          {dotGeoJSON && (
            <Source id="dot" type="geojson" data={dotGeoJSON}>
              <Layer id="dot-layer" type="circle"
                paint={{
                  'circle-radius': 6,
                  'circle-color': '#06b6d4',
                  'circle-stroke-width': 2,
                  'circle-stroke-color': '#ffffff',
                }}
              />
            </Source>
          )}
        </Map>

        {/* Blend left edge into form */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[#0A0A0A] via-transparent to-transparent" style={{ width: '30%' }} />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0A0A0A]/50 to-transparent" />

        {/* Floating label */}
        <div className="absolute bottom-8 right-8 text-right">
          <p className="text-white/60 text-sm font-semibold">Islamabad</p>
          <p className="text-white/25 text-xs">Live Route Network</p>
        </div>
      </div>
    </div>
  );
}
