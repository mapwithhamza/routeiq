/**
 * src/pages/Dashboard.tsx — Phase 12 (UI Redesign)
 * Welcome heading, 4 metric cards, delivery status progress bars,
 * algorithm performance chart. Keeps all existing API calls & logic untouched.
 */
import { useQuery } from '@tanstack/react-query';
import ReactECharts from 'echarts-for-react';
import { Package, Users, Route, TrendingUp, ArrowUpRight, DollarSign, Clock, CheckCircle2, XCircle, Activity } from 'lucide-react';
import { analyticsApi, transactionsApi, deliveriesApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/ui/Spinner';

// Fixed ordered labels for the 7 algorithms used in RouteIQ
const ALGO_LABELS: { short: string; match: RegExp }[] = [
  { short: 'BFS',      match: /bfs/i },
  { short: 'DFS',      match: /dfs/i },
  { short: 'Dijkstra', match: /dijkstra/i },
  { short: 'A*',       match: /a\*/i },
  { short: 'Greedy',   match: /greedy/i },
  { short: 'TSP',      match: /tsp/i },
  { short: 'Sort',     match: /sort/i },
];

const ALGO_COLORS = ['#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const STATUS_CONFIG = [
  { key: 'pending',    label: 'Pending',    color: '#64748b', bg: 'bg-slate-500' },
  { key: 'assigned',   label: 'Assigned',   color: '#8b5cf6', bg: 'bg-violet-500' },
  { key: 'in_transit', label: 'In Transit', color: '#3b82f6', bg: 'bg-blue-500' },
  { key: 'delivered',  label: 'Delivered',  color: '#10b981', bg: 'bg-emerald-500' },
  { key: 'failed',     label: 'Failed',     color: '#ef4444', bg: 'bg-red-500' },
] as const;

export default function Dashboard() {
  const { user } = useAuth();
  const sumQuery = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: analyticsApi.summary,
  });

  const algoQuery = useQuery({
    queryKey: ['analytics', 'algorithms'],
    queryFn: analyticsApi.algorithms,
  });

  const { data: revenue } = useQuery({
    queryKey: ['revenue'],
    queryFn: transactionsApi.revenue,
  });

  const { data: recentDeliveries } = useQuery({
    queryKey: ['deliveries'],
    queryFn: deliveriesApi.list,
  });

  const { data: recentTransactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: transactionsApi.list,
  });

  if (sumQuery.isLoading || algoQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-10 w-10 text-cyan-500" />
      </div>
    );
  }

  const sum = sumQuery.data;
  const runs = algoQuery.data || [];

  // Aggregate raw AlgorithmRun records → avg runtime per fixed slot
  const avgRuntimes: (number | null)[] = ALGO_LABELS.map(({ match }) => {
    const matching = runs.filter((r) => match.test(r.algorithm_name));
    if (matching.length === 0) return null;
    const valid = matching.filter((r) => r.runtime_ms != null) as Array<
      (typeof runs)[0] & { runtime_ms: number }
    >;
    if (valid.length === 0) return null;
    return valid.reduce((acc, r) => acc + r.runtime_ms, 0) / valid.length;
  });

  const hasAlgoData = avgRuntimes.some((v) => v !== null);

  const totalDeliveries = sum?.total_deliveries || 0;

  const deliveredToday = (recentDeliveries || []).filter(d => {
    const date = new Date(d.created_at);
    const today = new Date();
    return d.status === 'delivered' &&
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth();
  }).length;

  const failedToday = (recentDeliveries || []).filter(d => {
    const date = new Date(d.created_at);
    const today = new Date();
    return d.status === 'failed' &&
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth();
  }).length;

  const last5Deliveries = (recentDeliveries || []).slice(0, 5);
  const last5Transactions = (recentTransactions || []).slice(0, 5);

  const statusValues: Record<string, number> = {
    pending:    sum?.pending || 0,
    in_transit: sum?.in_transit || 0,
    delivered:  sum?.delivered || 0,
    failed:     sum?.failed || 0,
    assigned:   totalDeliveries
      ? totalDeliveries - ((sum?.pending || 0) + (sum?.in_transit || 0) + (sum?.delivered || 0) + (sum?.failed || 0))
      : 0,
  };

  const metricCards = [
    {
      label: 'Total Revenue',
      value: `Rs. ${(revenue?.total_revenue || 0).toLocaleString()}`,
      sub: `${revenue?.completed_transactions || 0} transactions`,
      Icon: DollarSign,
      gradient: 'dark:from-emerald-500/20 dark:to-teal-500/10',
      iconColor: 'text-emerald-500 dark:text-emerald-400',
      ring: 'dark:ring-emerald-500/20 ring-gray-100',
    },
    {
      label: 'Total Deliveries',
      value: totalDeliveries,
      sub: 'All time',
      Icon: Package,
      gradient: 'dark:from-cyan-500/20 dark:to-cyan-600/5',
      iconColor: 'text-cyan-500 dark:text-cyan-400',
      ring: 'dark:ring-cyan-500/20 ring-gray-100',
    },
    {
      label: 'Active Riders',
      value: `${sum?.active_riders || 0}/${sum?.total_riders || 0}`,
      sub: 'On duty',
      Icon: Users,
      gradient: 'dark:from-emerald-500/20 dark:to-emerald-600/5',
      iconColor: 'text-emerald-500 dark:text-emerald-400',
      ring: 'dark:ring-emerald-500/20 ring-gray-100',
    },
    {
      label: 'Routes Optimized',
      value: sum?.routes_optimized || 0,
      sub: 'All time',
      Icon: Route,
      gradient: 'dark:from-indigo-500/20 dark:to-indigo-600/5',
      iconColor: 'text-indigo-500 dark:text-indigo-400',
      ring: 'dark:ring-indigo-500/20 ring-gray-100',
    },
    {
      label: 'Avg Distance',
      value: `${sum?.avg_distance || 0} km`,
      sub: 'Per route',
      Icon: TrendingUp,
      gradient: 'dark:from-amber-500/20 dark:to-amber-600/5',
      iconColor: 'text-amber-500 dark:text-amber-400',
      ring: 'dark:ring-amber-500/20 ring-gray-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0D1117] p-6 max-w-7xl mx-auto space-y-8">
      {/* Welcome Heading */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-500 dark:text-cyan-400 mb-1">
            Route Intelligence
          </p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-[#E6EDF3] tracking-tight">
            {user?.display_name ? `Welcome, ${user.display_name}` : 'Dashboard Overview'}
          </h1>
          <p className="mt-1 text-gray-500 dark:text-[#8B949E] text-sm">
            High-level insights across all deliveries and riders.
          </p>
        </div>
        <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </span>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {metricCards.map(({ label, value, sub, Icon, gradient, iconColor, ring }) => (
          <div
            key={label}
            className={`rounded-xl border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#1C2128] shadow-md dark:shadow-none p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 relative overflow-hidden`}
          >
            {/* Subtle gradient overlay for dark mode */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} pointer-events-none`} />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-9 h-9 rounded-lg bg-gray-50 dark:bg-slate-900/60 ring-1 ${ring} flex items-center justify-center`}>
                  <Icon size={18} className={iconColor} />
                </div>
                <ArrowUpRight size={14} className="text-gray-400 dark:text-[#8B949E]" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-[#E6EDF3] font-mono">
                {value}
              </p>
              <p className="mt-0.5 text-sm font-medium text-gray-700 dark:text-[#8B949E]">
                {label}
              </p>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-[#8B949E]">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery Status Progress Bars */}
        <div className="rounded-xl border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#1C2128] shadow-md dark:shadow-none p-6">
          <h2 className="text-base font-semibold text-gray-800 dark:text-[#E6EDF3] mb-5">
            Deliveries by Status
          </h2>
          <div className="space-y-4">
            {STATUS_CONFIG.map(({ key, label, bg }) => {
              const val = statusValues[key] || 0;
              const pct = totalDeliveries > 0 ? Math.round((val / totalDeliveries) * 100) : 0;
              return (
                <div key={key}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm text-gray-500 dark:text-[#8B949E]">{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900 dark:text-[#E6EDF3] font-mono">{val}</span>
                      <span className="text-xs text-gray-400 dark:text-[#8B949E]">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200 dark:bg-slate-700/50 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${bg} transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Algorithm Performance Chart */}
        <div className="rounded-xl border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#1C2128] shadow-md dark:shadow-none p-6">
          <h2 className="text-base font-semibold text-gray-800 dark:text-[#E6EDF3] mb-5">
            Algorithm Performance
          </h2>
          {!hasAlgoData ? (
            <div className="h-64 flex flex-col items-center justify-center text-center gap-3">
              <BarChart3Icon />
              <p className="text-sm text-gray-500 dark:text-[#8B949E] max-w-xs">
                Run a benchmark on the Algorithms page to see performance data
              </p>
            </div>
          ) : (
            <div style={{ height: '256px' }}>
              <ReactECharts
                option={{
                  backgroundColor: 'transparent',
                  tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'shadow' },
                    formatter: (params: unknown) => {
                      const p = (params as Array<{ name: string; value: number | null }>)[0];
                      return `${p.name}<br/>Avg Runtime: <b>${
                        p.value !== null ? Number(p.value).toFixed(3) : 'N/A'
                      } ms</b>`;
                    },
                  },
                  grid: { left: '3%', right: '4%', bottom: '3%', top: '4%', containLabel: true },
                  xAxis: {
                    type: 'category',
                    data: ALGO_LABELS.map((a) => a.short),
                    axisLine: { lineStyle: { color: '#334155' } },
                    axisLabel: { color: '#64748b', interval: 0, fontSize: 11 },
                  },
                  yAxis: {
                    type: 'value',
                    name: 'ms',
                    nameTextStyle: { color: '#475569', fontSize: 10 },
                    splitLine: { lineStyle: { color: '#1e293b' } },
                    axisLabel: { color: '#64748b' },
                  },
                  series: [
                    {
                      name: 'Avg Runtime (ms)',
                      type: 'bar',
                      barWidth: '55%',
                      data: avgRuntimes.map((val, i) => ({
                        value: val !== null ? parseFloat(val.toFixed(3)) : 0,
                        itemStyle: {
                          color: ALGO_COLORS[i],
                          borderRadius: [4, 4, 0, 0],
                          opacity: val !== null ? 1 : 0.2,
                        },
                      })),
                    },
                  ],
                }}
                style={{ height: '100%', width: '100%' }}
                theme="dark"
                opts={{ renderer: 'svg' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending Now', value: statusValues['pending'] || 0, color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', icon: Clock },
          { label: 'Delivered Today', value: deliveredToday, color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', icon: CheckCircle2 },
          { label: 'Failed Today', value: failedToday, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10', icon: XCircle },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#1C2128] shadow-md dark:shadow-none p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Row — Recent Activity + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Deliveries */}
        <div className="rounded-xl border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#1C2128] shadow-md dark:shadow-none overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-200 dark:border-[#30363D] bg-gray-50 dark:bg-[#161B22] flex items-center gap-2">
            <Activity size={14} className="text-gray-500 dark:text-[#8B949E]" />
            <h2 className="text-sm font-semibold text-gray-800 dark:text-[#E6EDF3]">Recent Deliveries</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-[#30363D]">
            {last5Deliveries.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-slate-500 text-center py-6">No deliveries yet.</p>
            ) : (
              last5Deliveries.map(d => (
                <div key={d.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-[#262D36] transition">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-[#E6EDF3] truncate">{d.title}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{d.address || 'No address'}</p>
                  </div>
                  <span className={`ml-3 shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                    d.status === 'delivered' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                    d.status === 'pending' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                    d.status === 'failed' ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                    d.status === 'in_transit' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' :
                    'bg-violet-500/15 text-violet-400 border-violet-500/30'
                  }`}>
                    {d.status.replace('_', ' ')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="rounded-xl border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#1C2128] shadow-md dark:shadow-none overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-200 dark:border-[#30363D] bg-gray-50 dark:bg-[#161B22] flex items-center gap-2">
            <DollarSign size={14} className="text-gray-500 dark:text-[#8B949E]" />
            <h2 className="text-sm font-semibold text-gray-800 dark:text-[#E6EDF3]">Recent Transactions</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-[#30363D]">
            {last5Transactions.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-slate-500 text-center py-6">No transactions yet.</p>
            ) : (
              last5Transactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-[#262D36] transition">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-[#E6EDF3] truncate">
                      {tx.description || `Delivery #${tx.delivery_id}`}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="ml-3 shrink-0 text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    Rs. {tx.amount.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BarChart3Icon() {
  return (
    <svg className="w-12 h-12 text-gray-400 dark:text-[#8B949E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}
