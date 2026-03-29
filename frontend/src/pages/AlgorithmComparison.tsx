/**
 * src/pages/AlgorithmComparison.tsx — Phase 12 (UI Redesign)
 * Toggle node selector, winner banner, comparison table, 2 ECharts charts.
 * All benchmark logic, mutation calls, data filtering preserved untouched.
 * Uses echarts-for-react wrapper only — never raw echarts DOM API.
 */
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import ReactECharts from 'echarts-for-react';
import { Play, Trophy, BarChart3, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

import { routesApi } from '../lib/api';
import type { BenchmarkResult } from '../types';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';

// All 7 algorithms the backend runs
const ALL_ALGOS = ['BFS', 'DFS', 'Dijkstra', 'A*', 'Greedy-NN', 'TSP-DP', 'MergeSort'] as const;

// Colors per algorithm for consistent chart coloring
const ALGO_COLORS: Record<string, string> = {
  'BFS':       '#6366f1',
  'DFS':       '#8b5cf6',
  'Dijkstra':  '#06b6d4',
  'A*':        '#10b981',
  'Greedy-NN': '#f59e0b',
  'TSP-DP':    '#ef4444',
  'MergeSort': '#94a3b8',
};

type NodeSize = 10 | 50 | 200;

export default function AlgorithmComparison() {
  const [nodeSize, setNodeSize] = useState<NodeSize>(10);
  const [results, setResults] = useState<BenchmarkResult[] | null>(null);
  const [selectedAlgo, setSelectedAlgo] = useState<string | null>(null);

  const benchmarkMut = useMutation({
    mutationFn: routesApi.benchmark,
    onSuccess: (data) => {
      setResults(data);
      setSelectedAlgo(null);
      toast.success(`Benchmark complete — ${data.length} results returned.`);
    },
    onError: () => toast.error('Benchmark failed. Is the backend running?'),
  });

  // Filter to the chosen node size, excluding NetworkX validation rows
  const filtered: BenchmarkResult[] = (results ?? []).filter(
    (r) => r.nodes === nodeSize && !r.algorithm.includes('_vs_'),
  );

  // Find the best algorithm by shortest distance
  const routableFiltered = filtered.filter((r) => r.distance_km != null && !r.error);
  const winnerAlgo =
    routableFiltered.length > 0
      ? routableFiltered.reduce((best, r) =>
          (r.distance_km ?? Infinity) < (best.distance_km ?? Infinity) ? r : best,
        ).algorithm
      : null;

  // ECharts: Distance comparison
  const distanceChartOptions = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', formatter: (p: any[]) => `${p[0].name}<br/>${p[0].value?.toFixed(4) ?? 'N/A'} km` },
    grid: { top: 12, bottom: 40, left: 55, right: 20 },
    xAxis: {
      type: 'category' as const,
      data: ALL_ALGOS as unknown as string[],
      axisLabel: { color: '#64748b', rotate: 15, fontSize: 11 },
      axisLine: { lineStyle: { color: '#334155' } },
    },
    yAxis: {
      type: 'value' as const,
      name: 'km',
      nameTextStyle: { color: '#475569' },
      axisLabel: { color: '#64748b' },
      splitLine: { lineStyle: { color: '#1e293b' } },
    },
    series: [
      {
        type: 'bar' as const,
        barMaxWidth: 40,
        data: ALL_ALGOS.map((algo) => {
          const row = filtered.find((r) => r.algorithm === algo);
          return {
            value: row?.distance_km ?? null,
            itemStyle: { color: ALGO_COLORS[algo] ?? '#6366f1', borderRadius: [4, 4, 0, 0] },
          };
        }),
        emphasis: { itemStyle: { shadowBlur: 12, shadowColor: 'rgba(99,102,241,0.5)' } },
      },
    ],
  };

  // ECharts: Runtime comparison
  const runtimeChartOptions = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', formatter: (p: any[]) => `${p[0].name}<br/>${p[0].value?.toFixed(4) ?? 'N/A'} ms` },
    grid: { top: 12, bottom: 40, left: 65, right: 20 },
    xAxis: {
      type: 'category' as const,
      data: ALL_ALGOS as unknown as string[],
      axisLabel: { color: '#64748b', rotate: 15, fontSize: 11 },
      axisLine: { lineStyle: { color: '#334155' } },
    },
    yAxis: {
      type: 'value' as const,
      name: 'ms',
      nameTextStyle: { color: '#475569' },
      axisLabel: { color: '#64748b' },
      splitLine: { lineStyle: { color: '#1e293b' } },
    },
    series: [
      {
        type: 'bar' as const,
        barMaxWidth: 40,
        data: ALL_ALGOS.map((algo) => {
          const row = filtered.find((r) => r.algorithm === algo);
          return {
            value: row?.runtime_ms ?? null,
            itemStyle: { color: ALGO_COLORS[algo] ?? '#6366f1', borderRadius: [4, 4, 0, 0] },
          };
        }),
        emphasis: { itemStyle: { shadowBlur: 12, shadowColor: 'rgba(245,158,11,0.5)' } },
      },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in bg-[#F0F2F5] dark:bg-[#0D1117] p-2 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-500 dark:text-cyan-400 mb-1">
            DSA Analysis
          </p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-[#E6EDF3] tracking-tight">
            Algorithm Comparison
          </h1>
          <p className="mt-1 text-gray-500 dark:text-[#8B949E] text-sm">
            Benchmark all 7 DSA algorithms and compare performance metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Node size toggle */}
          <div className="flex rounded-xl border border-gray-200 dark:border-slate-700/60 overflow-hidden bg-white dark:bg-slate-800/60 shadow-sm dark:shadow-none">
            {([10, 50, 200] as NodeSize[]).map((n) => (
              <button
                key={n}
                onClick={() => setNodeSize(n)}
                className={`px-4 py-2 text-sm font-semibold transition-all duration-150 ${
                  nodeSize === n
                    ? 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700/40'
                }`}
              >
                {n}
                <span className="ml-1 text-xs opacity-70">nodes</span>
              </button>
            ))}
          </div>

          <Button
            onClick={() => benchmarkMut.mutate()}
            isLoading={benchmarkMut.isPending}
            className="shadow-lg shadow-cyan-500/10"
          >
            <Play size={14} className="mr-1.5" />
            {benchmarkMut.isPending ? 'Running…' : 'Run Benchmark'}
          </Button>
        </div>
      </div>

      {/* Loading */}
      {benchmarkMut.isPending && (
        <div className="rounded-xl shadow-md dark:shadow-none border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#1C2128] py-16 flex flex-col items-center gap-4">
          <Spinner className="h-12 w-12 text-cyan-600 dark:text-cyan-500" />
          <div className="text-center">
            <p className="text-gray-900 dark:text-slate-200 font-semibold">Running benchmark suite…</p>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1 animate-pulse">
              Executing all 7 algorithms on 10 / 50 / 200 node graphs
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      {results && !benchmarkMut.isPending && (
        <>
          {/* Winner Banner */}
          {winnerAlgo && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-5 py-4 flex items-center gap-4 animate-scale-in">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Trophy size={18} className="text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
                  Best Algorithm @ {nodeSize} nodes
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: ALGO_COLORS[winnerAlgo] ?? '#10b981' }}
                  />
                  <p className="text-xl font-bold text-gray-900 dark:text-slate-100">{winnerAlgo}</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                    Winner
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                  Shortest total distance:{' '}
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                    {filtered.find(r => r.algorithm === winnerAlgo)?.distance_km?.toFixed(4)} km
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Comparison Table */}
          <div className="rounded-xl shadow-md dark:shadow-none border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#1C2128] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-200 dark:border-[#30363D] bg-gray-50 dark:bg-[#161B22] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 size={15} className="text-gray-500 dark:text-[#8B949E]" />
                <h2 className="text-sm font-semibold text-gray-800 dark:text-[#E6EDF3]">
                  Results @ {nodeSize} nodes
                </h2>
              </div>
              {selectedAlgo && (
                <button
                  onClick={() => setSelectedAlgo(null)}
                  className="text-xs text-gray-500 hover:text-gray-900 dark:text-[#8B949E] dark:hover:text-[#E6EDF3] transition"
                >
                  Clear selection
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700/30">
                <thead className="bg-gray-50 dark:bg-[#161B22]">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-[#8B949E] uppercase tracking-wider">Algorithm</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-[#8B949E] uppercase tracking-wider">Distance (km)</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-[#8B949E] uppercase tracking-wider">Runtime (ms)</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-[#8B949E] uppercase tracking-wider">Nodes</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-[#8B949E] uppercase tracking-wider">Stops</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-[#8B949E] uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#30363D]">
                  {ALL_ALGOS.map((algo) => {
                    const row = filtered.find((r) => r.algorithm === algo);
                    const isWinner = algo === winnerAlgo;
                    const isSelected = selectedAlgo === algo;
                    return (
                      <tr
                        key={algo}
                        onClick={() => setSelectedAlgo(isSelected ? null : algo)}
                        className={`cursor-pointer transition-all duration-150 ${
                          isSelected
                            ? 'bg-cyan-50 dark:bg-cyan-500/10 border-l-2 border-cyan-500'
                            : isWinner
                            ? 'bg-emerald-50 dark:bg-emerald-500/5 hover:bg-emerald-100 dark:hover:bg-emerald-500/10'
                            : 'hover:bg-gray-50 dark:hover:bg-slate-700/20 border-l-2 border-transparent bg-white dark:bg-[#1C2128]'
                        }`}
                      >
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: ALGO_COLORS[algo] ?? '#6366f1' }}
                            />
                            <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">{algo}</span>
                            {isWinner && (
                              <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded-full px-1.5 py-0.5">
                                Best
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm font-mono">
                          {row?.error ? (
                            <span className="text-red-600 dark:text-red-400">Error</span>
                          ) : row?.distance_km != null ? (
                            <span className={isWinner ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-600 dark:text-slate-300'}>
                              {row.distance_km.toFixed(4)}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-slate-600">N/A</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm font-mono text-amber-600 dark:text-amber-300">
                          {row?.runtime_ms != null ? row.runtime_ms.toFixed(4) : '—'}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm font-mono text-indigo-600 dark:text-indigo-300">
                          {row?.nodes_explored ?? '—'}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm font-mono text-blue-600 dark:text-blue-300">
                          {row?.route_length ?? '—'}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {!row ? (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-slate-500">
                              <Clock size={11} /> No Data
                            </span>
                          ) : row.error ? (
                            <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                              <AlertCircle size={11} /> Failed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 size={11} /> OK
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className="rounded-xl shadow-md dark:shadow-none border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#1C2128] p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={14} className="text-cyan-600 dark:text-cyan-400" />
                <h2 className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                  Distance Comparison
                  <span className="ml-1.5 text-gray-500 dark:text-slate-500 font-normal text-xs">@ {nodeSize} nodes (km)</span>
                </h2>
              </div>
              <ReactECharts
                option={distanceChartOptions}
                style={{ height: 240 }}
                theme={document.documentElement.classList.contains('dark') ? 'dark' : undefined}
              />
            </div>

            <div className="rounded-xl shadow-md dark:shadow-none border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#1C2128] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={14} className="text-amber-500 dark:text-amber-400" />
                <h2 className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                  Runtime Comparison
                  <span className="ml-1.5 text-gray-500 dark:text-slate-500 font-normal text-xs">@ {nodeSize} nodes (ms)</span>
                </h2>
              </div>
              <ReactECharts
                option={runtimeChartOptions}
                style={{ height: 240 }}
                theme="dark"
              />
            </div>
          </div>

          {/* Selected algorithm detail */}
          {selectedAlgo && (() => {
            const row = filtered.find((r) => r.algorithm === selectedAlgo);
            if (!row) return null;
            return (
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-5 animate-scale-in">
                <div className="flex items-center gap-2.5 mb-4">
                  <span
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: ALGO_COLORS[selectedAlgo] ?? '#6366f1' }}
                  />
                  <h2 className="text-base font-bold text-slate-100">{selectedAlgo} — Detailed Metrics</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Distance', value: row.distance_km != null ? `${row.distance_km.toFixed(4)} km` : 'N/A', color: 'text-emerald-400' },
                    { label: 'Runtime', value: `${row.runtime_ms?.toFixed(4)} ms`, color: 'text-amber-400' },
                    { label: 'Nodes Explored', value: String(row.nodes_explored ?? '—'), color: 'text-indigo-400' },
                    { label: 'Route Stops', value: String(row.route_length ?? '—'), color: 'text-blue-400' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-xl border border-gray-200 dark:border-slate-700/60 bg-gray-50 dark:bg-slate-900/50 p-4">
                      <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">{label}</p>
                      <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </>
      )}

      {/* Empty State */}
      {!results && !benchmarkMut.isPending && (
        <div className="rounded-xl shadow-inner border border-gray-300 dark:border-slate-700/60 border-dashed bg-gray-50 dark:bg-slate-900/30 py-20 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700/60 flex items-center justify-center">
            <BarChart3 size={28} className="text-gray-400 dark:text-slate-600" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-500 dark:text-slate-300">No benchmark data yet</p>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-1 max-w-xs">
              Select a node count above and click{' '}
              <span className="text-cyan-600 dark:text-cyan-400 font-medium">Run Benchmark</span> to compare all 7 algorithms.
            </p>
          </div>
          <Button
            onClick={() => benchmarkMut.mutate()}
            className="shadow-lg shadow-cyan-500/10"
          >
            <Play size={14} className="mr-1.5" />
            Run Benchmark Now
          </Button>
        </div>
      )}
    </div>
  );
}
