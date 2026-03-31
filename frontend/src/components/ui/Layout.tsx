/**
 * src/components/ui/Layout.tsx
 * Collapsible sidebar with lucide-react icons.
 * Topbar: logo, search, bell, dark toggle, user avatar.
 */
import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { deliveriesApi, ridersApi } from '../../lib/api';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function useOnClickOutside(ref: React.RefObject<HTMLElement | null>, handler: (event: MouseEvent | TouchEvent) => void) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}
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
  DollarSign,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/deliveries', label: 'Deliveries', Icon: Package },
  { to: '/riders', label: 'Riders', Icon: Users },
  { to: '/routes', label: 'Optimization', Icon: Map },
  { to: '/algorithms', label: 'Algorithms', Icon: BarChart3 },
  { to: '/transactions', label: 'Transactions', Icon: DollarSign },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(searchRef, () => setIsSearchOpen(false));
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Notifications State
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(notifRef, () => setIsNotifOpen(false));
  const [readNotifs, setReadNotifs] = useState<number[]>(() => {
    const saved = localStorage.getItem('routeiq_read_notifs');
    return saved ? JSON.parse(saved) : [];
  });

  // Queries for global search & notifs
  const { data: deliveries } = useQuery({ queryKey: ['deliveries'], queryFn: deliveriesApi.list });
  const { data: riders } = useQuery({ queryKey: ['riders'], queryFn: ridersApi.list });

  // Calculate Search Results
  const searchResults = (() => {
    if (!debouncedSearchTerm.trim()) return { deliveries: [], riders: [] };
    const term = debouncedSearchTerm.toLowerCase();
    return {
      deliveries: (deliveries || []).filter(d => 
        (d.title?.toLowerCase().includes(term)) || 
        (d.address?.toLowerCase().includes(term))
      ).slice(0, 5),
      riders: (riders || []).filter(r => 
        r.name?.toLowerCase().includes(term)
      ).slice(0, 5)
    };
  })();

  // Calculate Notifications
  const notifications = (deliveries || [])
    .slice()
    .sort((a, b) => b.id - a.id)
    .slice(0, 5);
  const unreadCount = notifications.filter(n => !readNotifs.includes(n.id)).length;

  const markAllRead = () => {
    const allIds = notifications.map(n => n.id);
    const merged = Array.from(new Set([...readNotifs, ...allIds]));
    setReadNotifs(merged);
    localStorage.setItem('routeiq_read_notifs', JSON.stringify(merged));
  };

  const handleResultClick = (path: string) => {
    setIsSearchOpen(false);
    setSearchTerm('');
    navigate(path);
  };

  const sidebarW = collapsed ? 'w-[68px]' : 'w-64';
  const mainMargin = collapsed ? 'ml-[68px]' : 'ml-64';

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'RQ';

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-[#0D1117] font-sans transition-colors duration-300">
      {/* ─── Sidebar ─── */}
      <aside
        className={`
          fixed inset-y-0 left-0 flex flex-col border-r border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22]
          transition-all duration-300 ease-in-out z-30 shrink-0
          ${sidebarW}
        `}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-gray-200 dark:border-[#30363D] ${collapsed ? 'justify-center' : ''}`}>
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Truck size={16} className="text-white" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-slate-100">
              Route<span className="text-cyan-500 dark:text-cyan-400">IQ</span>
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
                    ? 'bg-blue-50 text-blue-600 dark:bg-[#1C2128] dark:text-[#00D4FF] shadow-sm'
                    : 'text-gray-700 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700/40 hover:text-gray-900 dark:hover:text-slate-100'
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User Footer */}
        <div className={`p-3 border-t border-gray-200 dark:border-[#30363D] ${collapsed ? 'flex justify-center' : ''}`}>
          {!collapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                {user?.picture_url ? (
                  <img src={user.picture_url} alt="Avatar" className="w-8 h-8 rounded-full shrink-0 object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 truncate max-w-[110px]">
                    {user?.email}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-slate-500 capitalize">{user?.role}</p>
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
          className="absolute -right-3 top-[72px] z-40 w-6 h-6 rounded-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-[#161B22] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 transition shadow-md"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* ─── Main Area ─── */}
      <div className={`flex-1 flex flex-col min-w-0 bg-gray-100 dark:bg-[#0D1117] transition-all duration-300 ease-in-out ${mainMargin}`}>
        {/* Topbar */}
        <header className="h-14 flex items-center gap-4 px-6 border-b border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22] sticky top-0 z-20">
          {/* Search */}
          <div className="relative flex-1 max-w-sm hidden md:block" ref={searchRef}>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              placeholder="Quick search…"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700/40 text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition"
            />
            {isSearchOpen && debouncedSearchTerm.trim() && (
              <div className="absolute top-full mt-2 w-full bg-white dark:bg-[#1C2128] border border-gray-200 dark:border-[#30363D] shadow-lg rounded-xl overflow-hidden z-50 animate-fade-in max-h-[400px] overflow-y-auto">
                <div className="p-2 space-y-4">
                  {searchResults.deliveries.length > 0 && (
                    <div>
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 px-2">Deliveries</h3>
                      <div className="space-y-0.5">
                        {searchResults.deliveries.map(d => (
                          <button
                            key={d.id}
                            onClick={() => handleResultClick('/deliveries')}
                            className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50 transition text-left"
                          >
                            <div className="w-6 h-6 rounded bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                              <Package size={12} className="text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-slate-200 truncate">{d.title}</p>
                              <p className="text-[10px] text-gray-500 dark:text-slate-400 capitalize">{d.status}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {searchResults.riders.length > 0 && (
                    <div>
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 px-2">Riders</h3>
                      <div className="space-y-0.5">
                        {searchResults.riders.map(r => (
                          <button
                            key={r.id}
                            onClick={() => handleResultClick('/riders')}
                            className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50 transition text-left"
                          >
                            <div className="w-6 h-6 rounded bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                              <Users size={12} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-slate-200 truncate">{r.name}</p>
                              <p className="text-[10px] text-gray-500 dark:text-slate-400 capitalize">{r.vehicle_type || 'Unknown'}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {searchResults.deliveries.length === 0 && searchResults.riders.length === 0 && (
                    <div className="p-4 text-center text-sm text-gray-500 dark:text-slate-400">
                      No matching records found.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Bell */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotifOpen(p => !p)}
                className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700/40 transition"
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-[#161B22]">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {isNotifOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-[#1C2128] border border-gray-200 dark:border-[#30363D] shadow-lg rounded-xl overflow-hidden z-50 animate-fade-in">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-[#30363D] flex items-center justify-between bg-gray-50 dark:bg-[#161B22]">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Notifications</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-medium">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="p-1 max-h-[300px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map(n => {
                        const isUnread = !readNotifs.includes(n.id);
                        return (
                          <div key={n.id} className={`p-3 text-sm rounded-lg flex gap-3 transition ${isUnread ? 'bg-cyan-50/50 dark:bg-cyan-900/10' : 'hover:bg-gray-50 dark:hover:bg-slate-800/30'}`}>
                            <div className="shrink-0 mt-0.5">
                              <div className="w-2 h-2 rounded-full mt-1.5 bg-cyan-500" style={{ opacity: isUnread ? 1 : 0 }} />
                            </div>
                            <div>
                              <p className={`text-gray-900 dark:text-slate-200 ${isUnread ? 'font-semibold' : 'font-medium'}`}>
                                📦 {n.title} is pending delivery
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Just now</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-500 dark:text-slate-400">
                        No notifications.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700/40 transition"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Avatar */}
            {user?.picture_url ? (
              <img src={user.picture_url} alt="Avatar" className="w-8 h-8 rounded-full ml-1 cursor-pointer ring-2 ring-cyan-500/20 hover:ring-cyan-500/50 transition object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white ml-1 cursor-pointer ring-2 ring-cyan-500/20 hover:ring-cyan-500/50 transition">
                {initials}
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto min-h-screen bg-gray-100 dark:bg-[#0D1117]">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
