/**
 * src/pages/Landing.tsx — Public landing page
 * Hero section with RouteIQ branding, tagline, CTA buttons.
 */
import { useNavigate } from 'react-router-dom';
import { Truck, Zap, Map, BarChart3, ArrowRight, Github } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0D1117] dark:bg-[#0D1117] flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Truck size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Route<span className="text-cyan-400">IQ</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/mapwithhamza/routeiq"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition"
          >
            <Github size={16} />
            GitHub
          </a>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white border border-white/20 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-semibold mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            CS-250 DSA Project · NUST IGIS 2024
          </div>

          {/* Main heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight mb-6 leading-tight">
            Intelligent
            <span className="block bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              Route Optimization
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            A full-stack GIS-based delivery route optimization dashboard powered by 7 DSA algorithms — BFS, DFS, Dijkstra, A*, Greedy-NN, TSP-DP, and MergeSort — running on real Islamabad road networks.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-semibold text-base transition shadow-lg shadow-cyan-500/25 w-full sm:w-auto justify-center"
            >
              Get Started
              <ArrowRight size={18} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl border border-white/20 hover:border-cyan-500/50 hover:bg-white/5 text-white font-semibold text-base transition w-full sm:w-auto justify-center"
            >
              <Zap size={18} className="text-cyan-400" />
              Live Demo
            </button>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { icon: Map, label: 'Real Road Routing' },
              { icon: BarChart3, label: '7 DSA Algorithms' },
              { icon: Zap, label: 'Algorithm Race Mode' },
              { icon: Truck, label: 'Live Tracking Sim' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-slate-300 text-sm"
              >
                <Icon size={14} className="text-cyan-400" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-8 py-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          © 2026 RouteIQ · Muhammad Hamza Khan · NUST IGIS-2024 · CMS 5081939
        </p>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/mapwithhamza/routeiq"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-slate-300 transition flex items-center gap-1"
          >
            <Github size={12} />
            GitHub
          </a>
          <span className="text-xs text-slate-500">CS-250 Data Structures & Algorithms</span>
        </div>
      </footer>
    </div>
  );
}
