import { useQuery } from '@tanstack/react-query';
import ReactECharts from 'echarts-for-react';
import { analyticsApi } from '../lib/api';
import Spinner from '../components/ui/Spinner';

export default function Dashboard() {
  const sumQuery = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: analyticsApi.summary,
  });

  const algoQuery = useQuery({
    queryKey: ['analytics', 'algorithms'],
    queryFn: analyticsApi.algorithms,
  });

  if (sumQuery.isLoading || algoQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-10 w-10 text-indigo-500" />
      </div>
    );
  }

  const sum = sumQuery.data;
  const algos = algoQuery.data || [];

  // Calculate algorithm totals
  const totalRuns = algos.reduce((acc, curr) => acc + curr.run_count, 0);
  const avgDistancesStr = algos
    .map(a => a.avg_distance_km)
    .filter((v): v is number => v !== null);
  const avgDist = avgDistancesStr.length > 0
    ? (avgDistancesStr.reduce((a, b) => a + b, 0) / avgDistancesStr.length).toFixed(1)
    : 0;

  // ECharts config
  const chartOptions = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['Pending', 'Assigned', 'In Transit', 'Delivered', 'Failed'],
      axisLine: { lineStyle: { color: '#4b5563' } },
      axisLabel: { color: '#9ca3af' },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#374151' } },
      axisLabel: { color: '#9ca3af' },
    },
    series: [
      {
        name: 'Deliveries',
        type: 'bar',
        barWidth: '50%',
        data: [
          { value: sum?.pending || 0, itemStyle: { color: '#6b7280' } },       // gray
          { value: sum?.total_deliveries ? sum.total_deliveries - (sum.pending + sum.in_transit + sum.delivered + sum.failed) : 0, itemStyle: { color: '#8b5cf6' } }, // purple for assigned
          { value: sum?.in_transit || 0, itemStyle: { color: '#3b82f6' } },     // blue
          { value: sum?.delivered || 0, itemStyle: { color: '#10b981' } },      // green
          { value: sum?.failed || 0, itemStyle: { color: '#ef4444' } },         // red
        ],
        itemStyle: { borderRadius: [4, 4, 0, 0] },
      },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard Overview</h1>
        <p className="mt-1 text-gray-400">High-level insights across all deliveries and riders.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Deliveries', value: sum?.total_deliveries || 0, text: 'text-indigo-400' },
          { label: 'Active Riders', value: `${sum?.active_riders || 0} / ${sum?.total_riders || 0}`, text: 'text-green-400' },
          { label: 'Routes Optimized', value: totalRuns, text: 'text-blue-400' },
          { label: 'Avg Route Distance', value: `${avgDist} km`, text: 'text-yellow-400' },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-400">{stat.label}</p>
            <p className={`mt-2 text-4xl font-extrabold tracking-tight ${stat.text}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Deliveries by Status */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Deliveries by Status</h2>
          <div className="h-72">
            <ReactECharts
              option={chartOptions}
              style={{ height: '100%', width: '100%' }}
              theme="dark"
              opts={{ renderer: 'svg' }}
            />
          </div>
        </div>
        
        {/* Algorithm Performance Chart */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Algorithm Performance</h2>
          {algos.length === 0 ? (
            <div className="h-96 flex flex-col items-center justify-center text-center">
              <svg className="w-12 h-12 text-gray-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm text-gray-500">No benchmark data yet. Run route optimization to populate this chart.</p>
            </div>
          ) : (
            <div className="h-96">
              <ReactECharts
                option={{
                  tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'shadow' },
                    formatter: (params: any) => {
                      const p = params[0];
                      return `${p.name}<br/>Avg Runtime: <b>${p.value !== null ? Number(p.value).toFixed(2) : 'N/A'} ms</b>`;
                    },
                  },
                  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                  xAxis: {
                    type: 'category',
                    data: algos.map(a => {
                      const name = a.algorithm_name;
                      if (name.includes('BFS')) return 'BFS';
                      if (name.includes('DFS')) return 'DFS';
                      if (name.includes('Dijkstra')) return 'Dijkstra';
                      if (name.includes('A*')) return 'A*';
                      if (name.includes('Greedy')) return 'Greedy';
                      if (name.includes('TSP')) return 'TSP';
                      if (name.includes('Sort')) return 'Sort';
                      return name;
                    }),
                    axisLine: { lineStyle: { color: '#4b5563' } },
                    axisLabel: { color: '#9ca3af', interval: 0, rotate: 45, fontSize: 11 },
                  },
                  yAxis: {
                    type: 'value',
                    name: 'ms',
                    nameTextStyle: { color: '#6b7280', fontSize: 11 },
                    splitLine: { lineStyle: { color: '#374151' } },
                    axisLabel: { color: '#9ca3af' },
                  },
                  series: [
                    {
                      name: 'Avg Runtime (ms)',
                      type: 'bar',
                      barWidth: '55%',
                      data: algos.map((a, i) => ({
                        value: a.avg_runtime_ms ?? 0,
                        itemStyle: {
                          color: ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'][i % 7],
                          borderRadius: [4, 4, 0, 0],
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
    </div>
  );
}
