/**
 * src/pages/Landing.tsx — Public landing page
 * Bringg-inspired bold typography, live MapLibre map, tech slider, scroll animations.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Map, { Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

// Real Islamabad road-following coordinates (F-7 → Blue Area → G-6 → G-9 → F-10 → F-7)
const HERO_WAYPOINTS: [number, number][] = [
  [73.0433, 33.7215], // F-7 Markaz
  [73.0480, 33.7190], // F-7 road east
  [73.0520, 33.7180], // Constitution Ave
  [73.0560, 33.7170], // Constitution Ave cont
  [73.0600, 33.7160], // Jinnah Ave junction
  [73.0630, 33.7140], // Blue Area west
  [73.0660, 33.7120], // Blue Area center
  [73.0690, 33.7100], // Blue Area east
  [73.0720, 33.7080], // Civic Center area
  [73.0750, 33.7050], // G-5 area
  [73.0760, 33.7020], // G-6/1
  [73.0750, 33.6990], // G-6/2
  [73.0730, 33.6960], // G-6/3
  [73.0700, 33.6940], // G-6/4
  [73.0670, 33.6930], // G-7
  [73.0640, 33.6925], // G-7 west
  [73.0600, 33.6930], // G-8 area
  [73.0560, 33.6935], // G-8/1
  [73.0520, 33.6938], // G-8/2
  [73.0480, 33.6940], // G-9 east
  [73.0440, 33.6942], // G-9 center
  [73.0400, 33.6944], // G-9/1
  [73.0360, 33.6944], // G-9/2
  [73.0320, 33.6944], // G-9/3
  [73.0290, 33.6944], // G-9/4
  [73.0260, 33.6950], // G-10
  [73.0240, 33.6970], // G-10/1
  [73.0220, 33.7000], // G-10/2
  [73.0210, 33.7030], // G-11
  [73.0200, 33.7060], // G-11/1
  [73.0200, 33.7090], // F-11 area
  [73.0210, 33.7120], // F-11/1
  [73.0230, 33.7150], // F-10/4
  [73.0260, 33.7170], // F-10/3
  [73.0300, 33.7185], // F-10/2
  [73.0340, 33.7200], // F-10/1
  [73.0380, 33.7210], // F-9 area
  [73.0410, 33.7215], // F-8
  [73.0433, 33.7215], // Back to F-7
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
      <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [animProgress, setAnimProgress] = useState(0);
  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const ANIM_DURATION = 6000;

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
            <p className="text-sm font-medium text-white/30 tracking-widest uppercase mb-8">
              RouteIQ · Last-Mile Solutions
            </p>
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold leading-none tracking-tight mb-8">
              <span className="text-white">The Smarter</span>
              <br />
              <span className="text-white/20">Way to</span>
              <br />
              <span className="text-white">Deliver.</span>
            </h1>
            <p className="text-white/35 text-lg mb-10 max-w-md leading-relaxed">
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

          {/* Right — Live Map */}
          <div className="relative h-[500px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
            <Map
              initialViewState={{ longitude: 73.0479, latitude: 33.6844, zoom: 11 }}
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
                  paint={{ 'line-color': '#ffffff', 'line-width': 1.5, 'line-opacity': 0.1 }}
                  layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                />
              </Source>

              {/* Animated route */}
              <Source id="anim-route" type="geojson" data={routeGeoJSON}>
                <Layer id="anim-route-line" type="line"
                  paint={{ 'line-color': '#06b6d4', 'line-width': 3, 'line-opacity': 0.9 }}
                  layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                />
              </Source>

              {/* Moving dot */}
              {dotGeoJSON && (
                <Source id="dot" type="geojson" data={dotGeoJSON}>
                  <Layer id="dot-layer" type="circle"
                    paint={{
                      'circle-radius': 7,
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
                    'circle-opacity': 0.3,
                  }}
                />
              </Source>
            </Map>
            {/* Map overlay gradient */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0A0A0A]/40 to-transparent" />
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
          <p className="text-sm text-white/30 uppercase tracking-widest mb-4">What RouteIQ Does</p>
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
            <span className="text-white/25">Any Route.</span>
            <br />
            <span className="text-white/25">Any Rider.</span>
            <br />
            <span className="text-cyan-400/60">Delivered.</span>
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
      <footer className="border-t border-white/5 px-8 py-12">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-start justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
                </svg>
              </div>
              <span className="text-sm font-bold">Route<span className="text-cyan-400">IQ</span></span>
            </div>
            <p className="text-xs text-white/25">
              Muhammad Hamza Khan · NUST IGIS-2024 · CMS 508193
            </p>
            <p className="text-xs text-white/20 mt-1">CS-250 Data Structures &amp; Algorithms</p>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://github.com/mapwithhamza/routeiq" target="_blank" rel="noopener noreferrer"
              className="text-xs text-white/25 hover:text-white/60 transition">
              GitHub
            </a>
            <a href="mailto:mhamzakhan.contact@gmail.com"
              className="text-xs text-white/25 hover:text-white/60 transition">
              Email
            </a>
            <a href="https://www.linkedin.com/in/mhamzakhan007" target="_blank" rel="noopener noreferrer"
              className="text-xs text-white/25 hover:text-white/60 transition">
              LinkedIn
            </a>
            <p className="text-xs text-white/15">© 2026 RouteIQ</p>
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
