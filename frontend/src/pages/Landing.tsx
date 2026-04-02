/**
 * src/pages/Landing.tsx — Public landing page
 * Hero section with RouteIQ branding, tagline, CTA buttons.
 */
import { useNavigate } from 'react-router-dom';
import { Truck, ArrowRight } from 'lucide-react';

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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
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


          {/* Main heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight mb-6 leading-tight">
            Intelligent
            <span className="block bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              Route Optimization
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
            The Smarter Way to Deliver.
          </p>

          {/* CTA Button */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-10 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-semibold text-base transition shadow-lg shadow-cyan-500/25"
            >
              Get Started
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-8 py-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          © 2026 RouteIQ · Muhammad Hamza Khan · NUST IGIS-2024 · CMS 508193
        </p>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/mapwithhamza/routeiq"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-slate-300 transition flex items-center gap-1"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            GitHub
          </a>
          <span className="text-xs text-slate-500">CS-250 Data Structures & Algorithms</span>
        </div>
      </footer>
    </div>
  );
}
