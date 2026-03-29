/**
 * src/components/ui/Layout.tsx
 * Collapsible sidebar with lucide-react icons.
 * Topbar: logo, search, bell, dark toggle, user avatar.
 */
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Users,
  Map,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Sun,
  Moon,
  Search,
  Truck,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/deliveries', label: 'Deliveries', Icon: Package },
  { to: '/riders', label: 'Riders', Icon: Users },
  { to: '/routes', label: 'Optimization', Icon: Map },
  { to: '/algorithms', label: 'Algorithms', Icon: BarChart3 },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  const sidebarW = collapsed ? 'w-[68px]' : 'w-64';

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'RQ';

  return (
    <div className="flex min-h-screen bg-surface-900 dark:bg-surface-900 bg-slate-50 font-sans">
      {/* ─── Sidebar ─── */}
      <aside
        className={`
          relative flex flex-col border-r border-slate-700/50 bg-surface-800 dark:bg-surface-800 bg-white
          transition-all duration-300 ease-in-out z-30 shrink-0
          ${sidebarW}
        `}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-700/40 ${collapsed ? 'justify-center' : ''}`}>
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Truck size={16} className="text-white" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight text-slate-100 dark:text-slate-100 text-slate-900">
              Route<span className="text-cyan-400">IQ</span>
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                ${collapsed ? 'justify-center' : ''}
                ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-400 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 dark:text-slate-400 text-slate-600 hover:bg-slate-700/40 dark:hover:bg-slate-700/40 hover:bg-slate-100 hover:text-slate-100 dark:hover:text-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User Footer */}
        <div className={`p-3 border-t border-slate-700/40 ${collapsed ? 'flex justify-center' : ''}`}>
          {!collapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-200 dark:text-slate-200 text-slate-800 truncate max-w-[110px]">
                    {user?.email}
                  </p>
                  <p className="text-[10px] text-slate-500 capitalize">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={() => logout()}
                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                title="Sign out"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => logout()}
              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-[72px] z-40 w-6 h-6 rounded-full border border-slate-600 bg-surface-800 dark:bg-surface-800 bg-white flex items-center justify-center text-slate-400 hover:text-cyan-400 transition shadow-md"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* ─── Main Area ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-14 flex items-center gap-4 px-6 border-b border-slate-700/40 bg-surface-800/80 dark:bg-surface-800/80 bg-white/90 backdrop-blur-sm sticky top-0 z-20">
          {/* Search */}
          <div className="relative flex-1 max-w-sm hidden md:block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              placeholder="Quick search…"
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg bg-slate-900/60 dark:bg-slate-900/60 bg-slate-100 border border-slate-700/40 dark:border-slate-700/40 border-slate-200 text-slate-300 dark:text-slate-300 text-slate-700 placeholder-slate-600 dark:placeholder-slate-600 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Bell */}
            <button className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/40 transition">
              <Bell size={17} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400 ring-1 ring-surface-800" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/40 transition"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white ml-1 cursor-pointer ring-2 ring-cyan-500/20 hover:ring-cyan-500/50 transition">
              {initials}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
