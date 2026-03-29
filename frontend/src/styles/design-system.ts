/**
 * src/styles/design-system.ts
 * Central design token object for RouteIQ.
 * All color/variant logic should derive from here.
 */

export const DS = {
  colors: {
    primary: '#06b6d4',      // cyan-500
    primaryDark: '#0891b2',  // cyan-600
    indigo: '#6366f1',
    surface: {
      dark: '#0f172a',       // slate-900
      card: '#1e293b',       // slate-800
      border: '#334155',     // slate-700
    },
    text: {
      primary: '#f1f5f9',    // slate-100
      secondary: '#94a3b8',  // slate-400
      muted: '#475569',      // slate-600
    },
  },

  priority: {
    urgent: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30', dot: '#ef4444' },
    high:   { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', dot: '#f59e0b' },
    normal: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30', dot: '#06b6d4' },
    low:    { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30', dot: '#64748b' },
  },

  status: {
    pending:    { bg: 'bg-slate-500/15', text: 'text-slate-300', border: 'border-slate-500/30' },
    assigned:   { bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/30' },
    in_transit: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
    delivered:  { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    failed:     { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
    available:  { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    on_route:   { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
    offline:    { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30' },
  },

  algo: {
    BFS:       '#6366f1',
    DFS:       '#8b5cf6',
    Dijkstra:  '#06b6d4',
    'A*':      '#10b981',
    'Greedy-NN': '#f59e0b',
    'TSP-DP':  '#ef4444',
    MergeSort: '#94a3b8',
  },

  routeColors: ['#06b6d4', '#6366f1', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#f97316'],

  card: 'rounded-xl border border-slate-700/60 bg-slate-800/60 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20',
  cardFlat: 'rounded-xl border border-slate-700/60 bg-slate-800/60',
} as const;

export type Priority = keyof typeof DS.priority;
export type Status = keyof typeof DS.status;
