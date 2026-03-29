import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import MainMap from '../components/map/MainMap';
import { deliveriesApi, ridersApi, routesApi } from '../lib/api';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { OptimizeRequest, OptimizeResponse, AlgorithmResult } from '../types';

export default function RouteOptimization() {
  const queryClient = useQueryClient();

  const [isAddMode, setIsAddMode] = useState(false);
  const [isBlockedMode, setIsBlockedMode] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState<number | ''>('');
  
  const [optResponse, setOptResponse] = useState<OptimizeResponse | null>(null);
  const [selectedAlgoName, setSelectedAlgoName] = useState<string>('');
  const [osrmRoute, setOsrmRoute] = useState<[number, number][] | null>(null);

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
        // Default to TSP-DP if available or first
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
    return <div className="flex h-full items-center justify-center"><Spinner className="h-10 w-10 text-indigo-500" /></div>;
  }

  // Derived state for Map
  const activeRider = riders?.find(r => r.id === Number(selectedRiderId)) || null;
  // Show all deliveries on map
  const activeDeliveries = deliveries || [];

  const selectedAlgoResult: AlgorithmResult | undefined = optResponse?.results.find(r => r.algorithm === selectedAlgoName);

  const routeWaypoints = selectedAlgoResult && optResponse 
    ? selectedAlgoResult.route.map(idx => optResponse.waypoints[idx])
    : [];

  useEffect(() => {
    if (routeWaypoints.length < 2) {
      setOsrmRoute(null);
      return;
    }

    let isMounted = true;
    const fetchOsrm = async () => {
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
      }
    };

    fetchOsrm();
    return () => { isMounted = false; };
  }, [selectedAlgoName, optResponse]);

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Route Optimization</h1>
          <p className="mt-1 text-gray-400">Generate intelligent paths through the DSA pipeline.</p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant={isBlockedMode ? 'danger' : 'secondary'}
            onClick={() => { setIsBlockedMode(!isBlockedMode); setIsAddMode(false); }}
          >
            {isBlockedMode ? 'Cancel Road Block' : 'Block Road'}
          </Button>
          <Button 
            variant={isAddMode ? 'primary' : 'secondary'}
            onClick={() => { setIsAddMode(!isAddMode); setIsBlockedMode(false); }}
          >
            {isAddMode ? 'Click Map...' : 'Add Delivery on Map'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Left Side: Map */}
        <div className="flex-1 rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden relative shadow-2xl">
          <MainMap 
            deliveries={activeDeliveries}
            rider={activeRider}
            routeWaypoints={routeWaypoints}
            osrmCoordinates={osrmRoute || undefined}
            isAddMode={isAddMode}
            isBlockedRoadMode={isBlockedMode}
            onMapClick={handleMapClick}
          />
        </div>

        {/* Right Side: Panel */}
        <div className="w-full lg:w-96 flex flex-col gap-6 overflow-y-auto">
          {/* Engine Controls */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-white mb-4">Optimization Engine</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Select Fleet Rider</label>
                <select 
                  className="w-full rounded-lg bg-gray-950 border border-gray-700 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  value={selectedRiderId}
                  onChange={(e) => {
                    setSelectedRiderId(e.target.value ? Number(e.target.value) : '');
                    setOptResponse(null);
                  }}
                >
                  <option value="">-- Choose Rider --</option>
                  {riders?.filter(r => r.status === 'available').map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <Button 
                className="w-full py-3 shadow-indigo-500/20 shadow-lg"
                onClick={handleOptimize}
                isLoading={optimizeMut.isPending}
              >
                Run Multi-Algorithm Search
              </Button>
            </div>
          </div>

          {/* Results Display */}
          {optResponse && (
            <div className="rounded-2xl border border-indigo-500/30 bg-gray-900 p-5 shadow-lg flex-1">
              <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-4">
                <h2 className="text-lg font-bold text-white leading-tight">
                  Optimization Results
                </h2>
                <Badge variant="success">Completed</Badge>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Algorithm Viewer</label>
                <select
                  className="w-full rounded-lg bg-indigo-950/40 border border-indigo-500/50 px-3 py-2 text-indigo-200 outline-none focus:ring-2 focus:ring-indigo-500 mb-6 font-semibold"
                  value={selectedAlgoName}
                  onChange={e => setSelectedAlgoName(e.target.value)}
                >
                  {optResponse.results.map(r => (
                    <option key={r.algorithm} value={r.algorithm}>{r.algorithm} Engine</option>
                  ))}
                </select>
              </div>

              {selectedAlgoResult ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-950 border border-gray-800">
                    <span className="text-sm text-gray-400">Total Distance</span>
                    <span className="font-bold text-white font-mono">{selectedAlgoResult.distance.toFixed(2)} km</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-950 border border-gray-800">
                    <span className="text-sm text-gray-400">Compute Time</span>
                    <span className="font-bold text-yellow-400 font-mono">{selectedAlgoResult.runtime_ms.toFixed(2)} ms</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-950 border border-gray-800">
                    <span className="text-sm text-gray-400">Nodes Explored</span>
                    <span className="font-bold text-indigo-400 font-mono">{selectedAlgoResult.nodes_explored} units</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-950 border border-gray-800">
                    <span className="text-sm text-gray-400">Total Waypoints</span>
                    <span className="font-bold text-blue-400 font-mono">{selectedAlgoResult.route.length} stops</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic text-center py-4">Select an algorithm to view metrics.</p>
              )}
            </div>
          )}

          {/* Fallback Empty Region */}
          {!optResponse && (
            <div className="rounded-2xl border border-gray-800 border-dashed bg-gray-900/50 p-5 flex flex-col items-center justify-center text-center flex-1 opacity-60">
              <svg className="w-12 h-12 text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p className="text-sm text-gray-400">Run optimization to compare DSA paths instantly.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
