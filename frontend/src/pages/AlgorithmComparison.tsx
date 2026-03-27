/**
 * src/pages/AlgorithmComparison.tsx — Phase 9
 * Benchmark runner + comparison table + ECharts bar charts.
 * Uses echarts-for-react wrapper only — never raw echarts DOM API.
 */
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import ReactECharts from 'echarts-for-react';

import { routesApi } from '../lib/api';
import type { BenchmarkResult } from '../types';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
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

  // Find the best algorithm by shortest distance (excluding MergeSort which has no distance)
  const routableFiltered = filtered.filter((r) => r.distance_km != null && !r.error);
  const winnerAlgo =
    routableFiltered.length > 0
      ? routableFiltered.reduce((best, r) =>
          (r.distance_km ?? Infinity) < (best.distance_km ?? Infinity) ? r : best,
        ).algorithm
      : null;

  // ECharts: Distance comparison bar chart
  const distanceChartOptions = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', formatter: (p: any[]) => `${p[0].name}<br/>${p[0].value?.toFixed(4) ?? 'N/A'} km` },
    grid: { top: 20, bottom: 40, left: 55, right: 20 },
    xAxis: {
      type: 'category' as const,
      data: ALL_ALGOS as unknown as string[],
      axisLabel: { color: '#94a3b8', rotate: 15, fontSize: 11 },
      axisLine: { lineStyle: { color: '#374151' } },
    },
    yAxis: {
      type: 'value' as const,
      name: 'km',
      nameTextStyle: { color: '#94a3b8' },
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: '#1f2937' } },
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

  // ECharts: Runtime comparison bar chart
  const runtimeChartOptions = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', formatter: (p: any[]) => `${p[0].name}<br/>${p[0].value?.toFixed(4) ?? 'N/A'} ms` },
    grid: { top: 20, bottom: 40, left: 65, right: 20 },
    xAxis: {
      type: 'category' as const,
      data: ALL_ALGOS as unknown as string[],
      axisLabel: { color: '#94a3b8', rotate: 15, fontSize: 11 },
      axisLine: { lineStyle: { color: '#374151' } },
    },
    yAxis: {
      type: 'value' as const,
      name: 'ms',
      nameTextStyle: { color: '#94a3b8' },
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: '#1f2937' } },
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
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Algorithm Comparison</h1>
          <p className="mt-1 text-gray-400">
            Benchmark all 7 DSA algorithms and compare performance metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Node size selector */}
          <div className="flex rounded-xl border border-gray-700 overflow-hidden bg-gray-900">
            {([10, 50, 200] as NodeSize[]).map((n) => (
              <button
                key={n}
                onClick={() => setNodeSize(n)}
                className={`px-4 py-2 text-sm font-semibold transition ${
                  nodeSize === n
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {n} nodes
              </button>
            ))}
          </div>

          <Button
            onClick={() => benchmarkMut.mutate()}
            isLoading={benchmarkMut.isPending}
            className="shadow-lg shadow-indigo-500/20"
          >
            {benchmarkMut.isPending ? 'Running…' : '▶ Run Benchmark'}
          </Button>
        </div>
      </div>

      {/* Loading overlay */}
      {benchmarkMut.isPending && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Spinner className="h-12 w-12 text-indigo-500" />
          <p className="text-gray-400 text-sm animate-pulse">
            Running all 7 algorithms on 10 / 50 / 200 node graphs…
          </p>
        </div>
      )}

      {/* Results */}
      {results && !benchmarkMut.isPending && (
        <>
          {/* Winner Banner */}
          {winnerAlgo && (
            <div className="rounded-2xl border border-green-500/30 bg-green-500/5 px-6 py-4 flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-green-400 font-semibold uppercase tracking-wider">Best Algorithm at {nodeSize} nodes</p>
                <p className="text-xl font-bold text-white mt-0.5">
                  {winnerAlgo}{' '}
                  <Badge variant="success">Winner</Badge>
                </p>
                <p className="text-sm text-gray-400 mt-0.5">
                  Shortest total distance:{' '}
                  <span className="text-green-400 font-mono font-semibold">
                    {filtered.find(r => r.algorithm === winnerAlgo)?.distance_km?.toFixed(4)} km
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Comparison Table */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">
                Results @ {nodeSize} nodes
                {selectedAlgo && (
                  <button onClick={() => setSelectedAlgo(null)} className="ml-3 text-xs text-gray-400 hover:text-white transition">
                    (clear selection)
                  </button>
                )}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-800">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Algorithm</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Distance (km)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Runtime (ms)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nodes Explored</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Route Stops</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {ALL_ALGOS.map((algo) => {
                    const row = filtered.find((r) => r.algorithm === algo);
                    const isWinner = algo === winnerAlgo;
                    const isSelected = selectedAlgo === algo;
                    return (
                      <tr
                        key={algo}
                        onClick={() => setSelectedAlgo(isSelected ? null : algo)}
                        className={`transition cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600/10 border-l-2 border-indigo-500'
                            : isWinner
                            ? 'bg-green-500/5 hover:bg-green-500/10'
                            : 'hover:bg-gray-800/30'
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: ALGO_COLORS[algo] ?? '#6366f1' }}
                            />
                            <span className="text-sm font-semibold text-white">{algo}</span>
                            {isWinner && <Badge variant="success">Best</Badge>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-300">
                          {row?.error ? (
                            <span className="text-red-400">Error</span>
                          ) : row?.distance_km != null ? (
                            <span className={isWinner ? 'text-green-400 font-bold' : ''}>
                              {row.distance_km.toFixed(4)}
                            </span>
                          ) : (
                            <span className="text-gray-600">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-yellow-300">
                          {row?.runtime_ms != null ? row.runtime_ms.toFixed(4) : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-indigo-300">
                          {row?.nodes_explored ?? '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-300">
                          {row?.route_length ?? '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {!row ? (
                            <Badge variant="default">No Data</Badge>
                          ) : row.error ? (
                            <Badge variant="error">Failed</Badge>
                          ) : (
                            <Badge variant="success">OK</Badge>
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
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Distance Chart */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
              <h2 className="text-base font-semibold text-white mb-4">
                Distance Comparison{' '}
                <span className="text-gray-500 font-normal text-sm">@ {nodeSize} nodes (km)</span>
              </h2>
              <ReactECharts
                option={distanceChartOptions}
                style={{ height: 240 }}
                theme="dark"
              />
            </div>

            {/* Runtime Chart */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
              <h2 className="text-base font-semibold text-white mb-4">
                Runtime Comparison{' '}
                <span className="text-gray-500 font-normal text-sm">@ {nodeSize} nodes (ms)</span>
              </h2>
              <ReactECharts
                option={runtimeChartOptions}
                style={{ height: 240 }}
                theme="dark"
              />
            </div>
          </div>

          {/* Selected Algorithm Detail */}
          {selectedAlgo && (() => {
            const row = filtered.find((r) => r.algorithm === selectedAlgo);
            if (!row) return null;
            return (
              <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: ALGO_COLORS[selectedAlgo] ?? '#6366f1' }}
                  />
                  {selectedAlgo} — Detailed Metrics
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Distance', value: row.distance_km != null ? `${row.distance_km.toFixed(4)} km` : 'N/A', color: 'text-green-400' },
                    { label: 'Runtime', value: `${row.runtime_ms?.toFixed(4)} ms`, color: 'text-yellow-400' },
                    { label: 'Nodes Explored', value: String(row.nodes_explored ?? '—'), color: 'text-indigo-400' },
                    { label: 'Route Stops', value: String(row.route_length ?? '—'), color: 'text-blue-400' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                      <p className="text-xs text-gray-400 mb-1">{label}</p>
                      <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </>
      )}

      {/* Empty state */}
      {!results && !benchmarkMut.isPending && (
        <div className="flex flex-col items-center justify-center py-24 gap-5 rounded-2xl border border-gray-800 border-dashed bg-gray-900/50">
          <svg className="w-16 h-16 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <div className="text-center">
            <p className="text-white font-semibold text-lg">No benchmark data yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Select a node count and click <span className="text-indigo-400 font-medium">▶ Run Benchmark</span> to compare all 7 algorithms.
            </p>
          </div>
          <Button onClick={() => benchmarkMut.mutate()} className="shadow-lg shadow-indigo-500/20">
            ▶ Run Benchmark Now
          </Button>
        </div>
      )}
    </div>
  );
}
