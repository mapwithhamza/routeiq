/**
 * src/pages/Landing.tsx — Public landing page
 * Bringg-inspired bold typography, live MapLibre map, tech slider, scroll animations.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Map, { Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const HERO_WAYPOINTS: [number, number][] = [
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

const TECH_ITEMS = [
  'React 18', 'FastAPI', 'PostgreSQL', 'MapLibre GL',
  'TypeScript', 'Python', 'Vercel', 'Neon DB',
  'TanStack Query', 'SQLAlchemy', 'Alembic', 'OSRM',
];

function useIntersectionObserver(ref: React.RefObject<Element>, options?: IntersectionObserverInit) {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, options);
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, options]);
  return isVisible;
}

function FeatureCard({ number, title, desc, delay }: { number: string; title: string; desc: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(ref as React.RefObject<Element>, { threshold: 0.2 });
  return (
    <div
      ref={ref}
      className="border-t border-white/10 pt-8"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      <p className="text-5xl font-bold text-white mb-3 font-mono">{number}</p>
      <p className="text-lg font-semibold text-white mb-2">{title}</p>
      <p className="text-sm text-white/60 leading-relaxed">{desc}</p>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [animProgress, setAnimProgress] = useState(0);
  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const ANIM_DURATION = 10000;

  // Animate route on hero map
  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = (elapsed % ANIM_DURATION) / ANIM_DURATION;
      setAnimProgress(progress);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  // Build animated route coordinates
  const totalPoints = HERO_WAYPOINTS.length - 1;
  const currentSegment = Math.floor(animProgress * totalPoints);
  const segmentProgress = (animProgress * totalPoints) - currentSegment;
  const animatedCoords: [number, number][] = [
    ...HERO_WAYPOINTS.slice(0, currentSegment + 1),
  ];
  if (currentSegment < totalPoints) {
    const from = HERO_WAYPOINTS[currentSegment];
    const to = HERO_WAYPOINTS[currentSegment + 1];
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

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
              <path d="M12 9V5M12 19v-4M9 12H5M19 12h-4"/>
              <path d="M6.34 6.34l2.12 2.12M15.54 15.54l2.12 2.12M6.34 17.66l2.12-2.12M15.54 8.46l2.12-2.12"/>
            </svg>
          </div>
          <span className="text-base font-bold tracking-tight">
            Route<span className="text-cyan-400">IQ</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/mapwithhamza/routeiq"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-white/40 hover:text-white transition"
          >
            GitHub
          </a>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-1.5 rounded-lg text-sm font-medium border border-white/15 hover:border-white/30 hover:bg-white/5 transition"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="min-h-screen flex items-center pt-20">
        <div className="w-full max-w-[1400px] mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left — Typography */}
          <div>
            <p className="text-sm font-medium text-white/50 tracking-widest uppercase mb-8">
              RouteIQ · Last-Mile Solutions
            </p>
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold leading-none tracking-tight mb-8">
              <span className="text-white">The Smarter</span>
              <br />
              <span className="text-white/40">Way to</span>
              <br />
              <span className="text-white">Deliver.</span>
            </h1>
            <p className="text-white/60 text-lg mb-10 max-w-md leading-relaxed">
              Intelligent delivery route optimization powered by 7 DSA algorithms running on real road networks.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition shadow-lg shadow-white/10"
            >
              Get Started
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Right — Live Map View with MapLibre */}
          <div className="relative h-[500px] overflow-hidden">
            <Map
              initialViewState={{ longitude: 73.0479, latitude: 33.6844, zoom: 11.5 }}
              style={{ width: '100%', height: '100%' }}
              mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
              interactive={false}
            >
              {/* Full route (faint) */}
              <Source id="full-route" type="geojson" data={{
                type: 'Feature',
                properties: {},
                geometry: { type: 'LineString', coordinates: HERO_WAYPOINTS },
              }}>
                <Layer id="full-route-line" type="line"
                  paint={{ 'line-color': '#ffffff', 'line-width': 2, 'line-opacity': 0.15 }}
                  layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                />
              </Source>

              {/* Animated route */}
              <Source id="anim-route" type="geojson" data={routeGeoJSON}>
                <Layer id="anim-route-glow" type="line"
                  paint={{ 'line-color': '#06b6d4', 'line-width': 8, 'line-opacity': 0.15 }}
                  layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                />
                <Layer id="anim-route-line" type="line"
                  paint={{ 'line-color': '#06b6d4', 'line-width': 2.5, 'line-opacity': 0.9 }}
                  layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                />
              </Source>

              {/* Moving dot */}
              {dotGeoJSON && (
                <Source id="dot" type="geojson" data={dotGeoJSON}>
                  <Layer id="dot-layer" type="circle"
                    paint={{
                      'circle-radius': 8,
                      'circle-color': '#06b6d4',
                      'circle-stroke-width': 3,
                      'circle-stroke-color': '#ffffff',
                      'circle-opacity': 1,
                    }}
                  />
                </Source>
              )}

              {/* Waypoint dots */}
              <Source id="waypoints" type="geojson" data={{
                type: 'FeatureCollection',
                features: HERO_WAYPOINTS.map(coord => ({
                  type: 'Feature',
                  properties: {},
                  geometry: { type: 'Point', coordinates: coord },
                })),
              }}>
                <Layer id="waypoint-dots" type="circle"
                  paint={{
                    'circle-radius': 4,
                    'circle-color': '#ffffff',
                    'circle-opacity': 0.4,
                  }}
                />
              </Source>
            </Map>
            {/* Seamless edge blending */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0A0A0A] via-transparent to-[#0A0A0A]/60" />
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[#0A0A0A] via-transparent to-[#0A0A0A]" />
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-l from-[#0A0A0A]/80 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      {/* ── Tech Slider ── */}
      <section className="py-16 border-y border-white/5 overflow-hidden">
        <div className="relative flex">
          <div className="flex animate-[slide_30s_linear_infinite] gap-16 whitespace-nowrap">
            {[...TECH_ITEMS, ...TECH_ITEMS].map((item, i) => (
              <span key={i} className="flex items-center gap-16 text-sm font-semibold text-white/50 hover:text-white/80 transition shrink-0 tracking-wide uppercase">
                {item}
                <span className="text-cyan-500/50">·</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-32 max-w-[1400px] mx-auto px-8">
        <div className="mb-20">
          <p className="text-sm text-white/50 uppercase tracking-widest mb-4">What RouteIQ Does</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white max-w-xl leading-tight">
            Built for the last mile.
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
          <FeatureCard
            number="7"
            title="DSA Algorithms"
            desc="BFS, DFS, Dijkstra, A*, Greedy-NN, TSP-DP and MergeSort — all running simultaneously on your delivery network."
            delay={0}
          />
          <FeatureCard
            number="↗"
            title="Real Road Routing"
            desc="OSRM-powered routing on actual Islamabad road networks. No straight lines — real roads, real distances."
            delay={150}
          />
          <FeatureCard
            number="⚡"
            title="Live Simulation"
            desc="Watch your rider navigate the optimized route in real time with animated tracking and delivery simulation."
            delay={300}
          />
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-32 border-t border-white/5">
        <div className="max-w-[1400px] mx-auto px-8">
          <h2 className="text-6xl sm:text-7xl lg:text-8xl font-bold leading-none tracking-tight mb-16">
            <span className="text-white/50">Any Route.</span>
            <br />
            <span className="text-white/50">Any Rider.</span>
            <br />
            <span className="text-cyan-400">Delivered.</span>
          </h2>
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition"
          >
            Get Started
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 px-8 pt-20 pb-12">
        <div className="max-w-[1400px] mx-auto">
          {/* Top footer */}
          <div className="flex flex-col lg:flex-row items-start justify-between gap-12 mb-16">
            {/* Brand */}
            <div className="max-w-xs">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
                  </svg>
                </div>
                <span className="text-base font-bold">Route<span className="text-cyan-400">IQ</span></span>
              </div>
              <p className="text-sm text-white/70 leading-relaxed mb-3">
                A full-stack GIS-based delivery route optimization dashboard. Built for CS-250 DSA at NUST IGIS.
              </p>
              <p className="text-xs text-white/50">
                Muhammad Hamza Khan · CMS 508193
              </p>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 gap-12">
              <div>
                <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-4">Project</p>
                <div className="space-y-3">
                  <a href="https://github.com/mapwithhamza/routeiq" target="_blank" rel="noopener noreferrer"
                    className="block text-sm text-white/70 hover:text-white transition">
                    GitHub Repository
                  </a>
                  <a href="https://routeiq-eight.vercel.app/login"
                    className="block text-sm text-white/70 hover:text-white transition">
                    Live Demo
                  </a>
                  <a href="https://routeiq-backend-lkz1.onrender.com/docs" target="_blank" rel="noopener noreferrer"
                    className="block text-sm text-white/70 hover:text-white transition">
                    API Docs
                  </a>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-4">Connect</p>
                <div className="space-y-3">
                  <a href="https://www.linkedin.com/in/mhamzakhan007" target="_blank" rel="noopener noreferrer"
                    className="block text-sm text-white/70 hover:text-white transition">
                    LinkedIn
                  </a>
                  <a href="mailto:mhamzakhan.contact@gmail.com"
                    className="block text-sm text-white/70 hover:text-white transition">
                    mhamzakhan.contact@gmail.com
                  </a>
                  <p className="text-sm text-white/30">NUST IGIS-2024</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom footer */}
          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/25">
              © 2026 RouteIQ · CS-250 Data Structures &amp; Algorithms · NUST IGIS
            </p>
            <p className="text-xs text-white/20">
              Built with React · FastAPI · PostgreSQL · MapLibre GL
            </p>
          </div>
        </div>
      </footer>

      {/* Inline styles for slider animation */}
      <style>{`
        @keyframes slide {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
