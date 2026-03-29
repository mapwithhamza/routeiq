/**
 * src/pages/RouteOptimization.tsx — Phase 12 (UI Redesign)
 * 70/30 split, full viewport height map, route colored by priority.
 * All API calls, hooks, OSRM logic preserved untouched.
 */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Map as MapIcon, Zap, Plus, Lock, ChevronDown, Activity, Navigation } from 'lucide-react';

import MainMap from '../components/map/MainMap';
import { deliveriesApi, ridersApi, routesApi } from '../lib/api';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import { OptimizeRequest, OptimizeResponse, AlgorithmResult } from '../types';

export default function RouteOptimization() {
  const queryClient = useQueryClient();

  const [isAddMode, setIsAddMode] = useState(false);
  const [isBlockedMode, setIsBlockedMode] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState<number | ''>('');

  const [optResponse, setOptResponse] = useState<OptimizeResponse | null>(null);
  const [selectedAlgoName, setSelectedAlgoName] = useState<string>('');
  const [osrmRoute, setOsrmRoute] = useState<[number, number][] | null>(null);
  const [isOsrmLoading, setIsOsrmLoading] = useState(false);

  // Data fetch
  const { data: deliveries, isLoading: deliveriesLoading } = useQuery({
    queryKey: ['deliveries'],
    queryFn: deliveriesApi.list,
  });

  const { data: riders, isLoading: ridersLoading } = useQuery({
    queryKey: ['riders'],
    queryFn: ridersApi.list,
  });

  // Mutations
  const createDeliveryMut = useMutation({
    mutationFn: deliveriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      toast.success('Map waypoint added');
    },
    onError: () => toast.error('Failed to add delivery on map'),
  });

  const optimizeMut = useMutation({
    mutationFn: routesApi.optimize,
    onSuccess: (data) => {
      setOptResponse(data);
      if (data.results && data.results.length > 0) {
        const p = data.results.find(r => r.algorithm === 'TSP-DP') || data.results[0];
        setSelectedAlgoName(p.algorithm);
      }
      toast.success('Route optimized successfully!');
    },
    onError: () => toast.error('Failed to optimize route'),
  });

  // Handlers
  const handleMapClick = (lat: number, lon: number) => {
    if (isAddMode) {
      const pendingCount = (deliveries?.filter(d => d.status === 'pending').length || 0) + 1;
      createDeliveryMut.mutate({
        title: `Map Drop-off #${pendingCount}`,
        lat,
        lon,
        priority: 'normal',
      });
      setIsAddMode(false);
    } else if (isBlockedMode) {
      toast.info('Blocked roads feature is planned for Phase 9!');
      setIsBlockedMode(false);
    }
  };

  const handleOptimize = () => {
    if (!selectedRiderId) {
      toast.error('Please select a rider to start the route');
      return;
    }
    const rider = riders?.find(r => r.id === Number(selectedRiderId));
    if (!rider || !rider.current_lat || !rider.current_lon) {
      toast.error('Selected rider has no active location coordinates.');
      return;
    }

    const unassigned = deliveries?.filter(d => d.status === 'pending' && !d.rider_id) || [];
    if (unassigned.length < 1) {
      toast.error('No unassigned pending deliveries to optimize.');
      return;
    }

    const payload: OptimizeRequest = {
      name: `Rider ${rider.name} Run`,
      rider_id: rider.id,
      waypoints: [
        { lat: rider.current_lat, lon: rider.current_lon, label: 'Start Point' },
        ...unassigned.map(d => ({ lat: d.lat, lon: d.lon, label: d.title }))
      ]
    };

    optimizeMut.mutate(payload);
  };

  if (deliveriesLoading || ridersLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-10 w-10 text-cyan-500" />
      </div>
    );
  }

  // Derived state for Map
  const activeRider = riders?.find(r => r.id === Number(selectedRiderId)) || null;
  const activeDeliveries = deliveries || [];

  const selectedAlgoResult: AlgorithmResult | undefined = optResponse?.results.find(
    r => r.algorithm === selectedAlgoName
  );

  const routeWaypoints = selectedAlgoResult && optResponse
    ? selectedAlgoResult.route.map(idx => optResponse.waypoints[idx])
    : [];

  // OSRM fetch — unchanged logic
  useEffect(() => {
    if (routeWaypoints.length < 2) {
      setOsrmRoute(null);
      setIsOsrmLoading(false);
      return;
    }

    let isMounted = true;
    const fetchOsrm = async () => {
      setIsOsrmLoading(true);
      try {
        const promises = [];
        for (let i = 0; i < routeWaypoints.length - 1; i++) {
          const wp1 = routeWaypoints[i];
          const wp2 = routeWaypoints[i + 1];
          const url = `https://router.project-osrm.org/route/v1/driving/${wp1.lon},${wp1.lat};${wp2.lon},${wp2.lat}?overview=full&geometries=geojson`;
          promises.push(
            fetch(url).then(res => {
              if (!res.ok) throw new Error('OSRM mapping failed');
              return res.json();
            })
          );
        }

        const results = await Promise.all(promises);
        const combinedCoords: [number, number][] = [];

        for (const res of results) {
          if (res.routes && res.routes.length > 0) {
            const coords = res.routes[0].geometry.coordinates as [number, number][];
            combinedCoords.push(...coords);
          }
        }

        if (isMounted && combinedCoords.length > 0) {
          setOsrmRoute(combinedCoords);
        } else if (isMounted) {
          setOsrmRoute(null);
        }
      } catch (err) {
        console.error('OSRM fetch error:', err);
        if (isMounted) setOsrmRoute(null);
      } finally {
        if (isMounted) setIsOsrmLoading(false);
      }
    };

    fetchOsrm();
    return () => { isMounted = false; };
  }, [selectedAlgoName, optResponse]);

  const pendingDeliveries = deliveries?.filter(d => d.status === 'pending' && !d.rider_id) || [];

  return (
    <div className="max-w-[1600px] mx-auto flex flex-col animate-fade-in bg-[#F0F2F5] dark:bg-[#0D1117] p-2 sm:p-0" style={{ height: 'calc(100vh - 7rem)' }}>
      {/* Header */}
      <div className="flex justify-between items-end mb-5 shrink-0">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-500 dark:text-cyan-400 mb-1">
            DSA Pipeline
          </p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-[#E6EDF3] tracking-tight">
            Route Optimization
          </h1>
          <p className="mt-1 text-gray-500 dark:text-[#8B949E] text-sm">
            Generate intelligent paths through the DSA pipeline.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant={isBlockedMode ? 'danger' : 'secondary'}
            onClick={() => { setIsBlockedMode(!isBlockedMode); setIsAddMode(false); }}
          >
            <Lock size={14} className="mr-1.5" />
            {isBlockedMode ? 'Cancel' : 'Block Road'}
          </Button>
          <Button
            variant={isAddMode ? 'primary' : 'secondary'}
            onClick={() => { setIsAddMode(!isAddMode); setIsBlockedMode(false); }}
          >
            <Plus size={14} className="mr-1.5" />
            {isAddMode ? 'Click Map…' : 'Add Delivery'}
          </Button>
        </div>
      </div>

      {/* 70/30 Split */}
      <div className="flex flex-col lg:flex-row gap-5 flex-1 min-h-0">
        {/* Map (70%) */}
        <div className="flex-[70] rounded-xl shadow-md dark:shadow-2xl border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#1C2128] overflow-hidden relative min-h-0">
          {/* Map Status Bar */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
            {isAddMode && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 text-white text-xs font-semibold shadow-lg animate-pulse">
                <Plus size={12} /> Click map to add delivery
              </div>
            )}
            {isBlockedMode && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold shadow-lg animate-pulse">
                <Lock size={12} /> Click road to block
              </div>
            )}
          </div>
          <MainMap
            deliveries={activeDeliveries}
            rider={activeRider}
            routeWaypoints={routeWaypoints}
            osrmCoordinates={osrmRoute || undefined}
            isAddMode={isAddMode}
            isBlockedRoadMode={isBlockedMode}
            onMapClick={handleMapClick}
          />
          {(optimizeMut.isPending || isOsrmLoading) && (
            <div className="absolute inset-0 bg-slate-950/70 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-4 bg-slate-900/80 rounded-2xl border border-slate-700/60 px-8 py-6 shadow-2xl">
                <Spinner className="h-10 w-10 text-cyan-500" />
                <div className="text-center">
                  <p className="text-white font-semibold text-base">
                    {optimizeMut.isPending ? 'Running DSA algorithms…' : 'Fetching road geometry…'}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">Calculating optimal routes</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Control Panel (30%) */}
        <div className="flex-[30] flex flex-col gap-4 overflow-y-auto min-w-[280px] max-w-[380px]">
          {/* Engine Controls */}
          <div className="rounded-xl shadow-md dark:shadow-none border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#1C2128] p-5 shrink-0">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-cyan-100 dark:bg-cyan-500/15 flex items-center justify-center">
                <Zap size={14} className="text-cyan-600 dark:text-cyan-400" />
              </div>
              <h2 className="text-sm font-semibold text-gray-800 dark:text-slate-200">Optimization Engine</h2>
            </div>

            <div className="space-y-3">
              {/* Rider selector */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">Select Fleet Rider</label>
                <div className="relative">
                  <select
                    className="w-full appearance-none rounded-lg bg-white dark:bg-slate-900/60 border border-gray-300 dark:border-slate-700/60 px-3 py-2 text-sm text-gray-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500/50 transition pr-8"
                    value={selectedRiderId}
                    onChange={(e) => {
                      setSelectedRiderId(e.target.value ? Number(e.target.value) : '');
                      setOptResponse(null);
                    }}
                  >
                    <option value="">— Choose Rider —</option>
                    {riders?.filter(r => r.status === 'available').map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-gray-50 dark:bg-slate-900/40 border border-gray-200 dark:border-slate-700/40 p-2.5 text-center">
                  <p className="text-base font-bold text-cyan-600 dark:text-cyan-400 font-mono">{pendingDeliveries.length}</p>
                  <p className="text-[10px] text-gray-500 dark:text-slate-500">Pending drops</p>
                </div>
                <div className="rounded-lg bg-gray-50 dark:bg-slate-900/40 border border-gray-200 dark:border-slate-700/40 p-2.5 text-center">
                  <p className="text-base font-bold text-violet-600 dark:text-violet-400 font-mono">7</p>
                  <p className="text-[10px] text-gray-500 dark:text-slate-500">Algorithms</p>
                </div>
              </div>

              <Button
                className="w-full py-2.5 shadow-lg shadow-cyan-500/10"
                onClick={handleOptimize}
                isLoading={optimizeMut.isPending}
              >
                <Zap size={14} className="mr-2" />
                Run Multi-Algorithm Search
              </Button>
            </div>
          </div>

          {/* Results Panel */}
          {optResponse && (
            <div className="rounded-xl shadow-md dark:shadow-none border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#1C2128] p-5 flex-1 animate-scale-in">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200 dark:border-slate-700/50">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-cyan-600 dark:text-cyan-400" />
                  <h2 className="text-sm font-semibold text-gray-800 dark:text-slate-200">Results</h2>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Complete
                </span>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">Algorithm Viewer</label>
                <div className="relative">
                  <select
                    className="w-full appearance-none rounded-lg bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-500/40 px-3 py-2 text-sm text-cyan-800 dark:text-cyan-200 outline-none focus:ring-2 focus:ring-cyan-500/50 pr-8 font-semibold"
                    value={selectedAlgoName}
                    onChange={e => setSelectedAlgoName(e.target.value)}
                  >
                    {optResponse.results.map(r => (
                      <option key={r.algorithm} value={r.algorithm}>{r.algorithm} Engine</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-600 dark:text-cyan-500/60 pointer-events-none" />
                </div>
              </div>

              {selectedAlgoResult ? (
                <div className="space-y-2">
                  {[
                    { label: 'Total Distance', value: `${selectedAlgoResult.distance.toFixed(2)} km`, color: 'text-emerald-600 dark:text-emerald-400', icon: Navigation },
                    { label: 'Compute Time', value: `${selectedAlgoResult.runtime_ms.toFixed(2)} ms`, color: 'text-amber-600 dark:text-amber-400', icon: Zap },
                    { label: 'Nodes Explored', value: `${selectedAlgoResult.nodes_explored} units`, color: 'text-indigo-600 dark:text-indigo-400', icon: Activity },
                    { label: 'Route Stops', value: `${selectedAlgoResult.route.length} stops`, color: 'text-blue-600 dark:text-blue-400', icon: MapIcon },
                  ].map(({ label, value, color, icon: Icon }) => (
                    <div key={label} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700/40">
                      <div className="flex items-center gap-2">
                        <Icon size={13} className="text-gray-400 dark:text-slate-500" />
                        <span className="text-xs text-gray-500 dark:text-[#8B949E]">{label}</span>
                      </div>
                      <span className={`text-sm font-bold font-mono ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-slate-500 italic text-center py-4">
                  Select an algorithm to view metrics.
                </p>
              )}
            </div>
          )}

          {/* Empty State */}
          {!optResponse && (
            <div className="rounded-xl shadow-inner border border-gray-300 dark:border-slate-700/60 border-dashed bg-gray-50 dark:bg-slate-900/30 p-6 flex flex-col items-center justify-center text-center flex-1">
              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700/60 flex items-center justify-center mb-3">
                <Zap size={20} className="text-gray-400 dark:text-slate-600" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">No Results Yet</p>
              <p className="text-xs text-gray-400 dark:text-[#8B949E] mt-1 max-w-[200px]">
                Select a rider and run optimization to compare DSA paths.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
