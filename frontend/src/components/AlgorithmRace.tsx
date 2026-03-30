/**
 * AlgorithmRace.tsx — Algorithm Race Mode with real MapLibre map
 * Deduplicates OSRM calls, toggleable algorithm filter, improved cards.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Trophy, SkipForward, Flag } from 'lucide-react';
import MapGL, { Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { OptimizeResponse, AlgorithmResult, Waypoint } from '../types';

interface AlgorithmRaceProps {
  isOpen: boolean;
  onClose: () => void;
  optResponse: OptimizeResponse;
}

const ALGO_COLORS: Record<string, string> = {
  'BFS':       '#06b6d4',
  'DFS':       '#8b5cf6',
  'Dijkstra':  '#10b981',
  'A*':        '#f59e0b',
  'Greedy-NN': '#ec4899',
  'TSP-DP':    '#3b82f6',
  'MergeSort': '#f97316',
};

interface RacerState {
  algorithm: string;
  color: string;
  runtime_ms: number;
  distance: number;
  route: number[];
  progress: number;
  finished: boolean;
  finishOrder: number;
}

function segmentKey(wp1: Waypoint, wp2: Waypoint): string {
  return `${wp1.lon.toFixed(5)},${wp1.lat.toFixed(5)}->${wp2.lon.toFixed(5)},${wp2.lat.toFixed(5)}`;
}

async function fetchSegment(wp1: Waypoint, wp2: Waypoint): Promise<[number, number][]> {
  const url = `https://router.project-osrm.org/route/v1/driving/${wp1.lon},${wp1.lat};${wp2.lon},${wp2.lat}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('OSRM failed');
    const data = await res.json();
    return data.routes?.[0]?.geometry?.coordinates as [number, number][] || [
      [wp1.lon, wp1.lat], [wp2.lon, wp2.lat]
    ];
  } catch {
    return [[wp1.lon, wp1.lat], [wp2.lon, wp2.lat]];
  }
}

async function fetchAllSegmentsDeduped(
  waypoints: Waypoint[],
  results: AlgorithmResult[]
): Promise<Record<string, [number, number][]>> {
  // Collect all unique segment pairs across all algorithms
  const uniqueSegments = new Map<string, { wp1: Waypoint; wp2: Waypoint }>();
  results.forEach(r => {
    for (let i = 0; i < r.route.length - 1; i++) {
      const wp1 = waypoints[r.route[i]];
      const wp2 = waypoints[r.route[i + 1]];
      if (!wp1 || !wp2) continue;
      const key = segmentKey(wp1, wp2);
      if (!uniqueSegments.has(key)) {
        uniqueSegments.set(key, { wp1, wp2 });
      }
    }
  });

  // Fetch segments sequentially with delay to avoid OSRM 429 rate limiting
  const segmentCache = new Map<string, [number, number][]>();
  const segmentEntries = Array.from(uniqueSegments.entries());
  for (let i = 0; i < segmentEntries.length; i++) {
    const [key, { wp1, wp2 }] = segmentEntries[i];
    const coords = await fetchSegment(wp1, wp2);
    segmentCache.set(key, coords);
    if (i < segmentEntries.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  // Assemble full route per algorithm from cached segments
  const routeCoords: Record<string, [number, number][]> = {};
  results.forEach(r => {
    const full: [number, number][] = [];
    for (let i = 0; i < r.route.length - 1; i++) {
      const wp1 = waypoints[r.route[i]];
      const wp2 = waypoints[r.route[i + 1]];
      if (!wp1 || !wp2) continue;
      const key = segmentKey(wp1, wp2);
      const seg = segmentCache.get(key) || [[wp1.lon, wp1.lat], [wp2.lon, wp2.lat]];
      const segCopy = [...seg] as [number, number][];
      if (full.length > 0 && segCopy.length > 0) segCopy.shift();
      full.push(...segCopy);
    }
    routeCoords[r.algorithm] = full;
  });

  return routeCoords;
}

function getMapCenter(waypoints: Waypoint[]): [number, number] {
  if (waypoints.length === 0) return [73.0479, 33.6844];
  const lats = waypoints.map(w => w.lat);
  const lons = waypoints.map(w => w.lon);
  return [
    (Math.min(...lons) + Math.max(...lons)) / 2,
    (Math.min(...lats) + Math.max(...lats)) / 2,
  ];
}

export default function AlgorithmRace({ isOpen, onClose, optResponse }: AlgorithmRaceProps) {
  const [racers, setRacers] = useState<RacerState[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [, setOsrmRoutes] = useState<Record<string, [number, number][]>>({});
  const [drawnRoutes, setDrawnRoutes] = useState<Record<string, [number, number][]>>({});
  const [isLoadingOsrm, setIsLoadingOsrm] = useState(false);
  const [activeAlgos, setActiveAlgos] = useState<Set<string>>(new Set());
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const finishCountRef = useRef(0);
  const racersRef = useRef<RacerState[]>([]);
  const osrmRoutesRef = useRef<Record<string, [number, number][]>>({});

  const mapCenter = getMapCenter(optResponse.waypoints);

  const initRacers = useCallback((): RacerState[] =>
    optResponse.results.map((r: AlgorithmResult) => ({
      algorithm: r.algorithm,
      color: ALGO_COLORS[r.algorithm] || '#94a3b8',
      runtime_ms: r.runtime_ms,
      distance: r.distance,
      route: r.route,
      progress: 0,
      finished: false,
      finishOrder: 0,
    })), [optResponse.results]);

  useEffect(() => {
    if (!isOpen) return;
    const initial = initRacers();
    setRacers(initial);
    racersRef.current = initial;
    setIsRunning(false);
    setIsFinished(false);
    setDrawnRoutes({});
    setActiveAlgos(new Set(optResponse.results.map(r => r.algorithm)));
    finishCountRef.current = 0;

    setIsLoadingOsrm(true);
    fetchAllSegmentsDeduped(optResponse.waypoints, optResponse.results).then(routes => {
      setOsrmRoutes(routes);
      osrmRoutesRef.current = routes;
      setIsLoadingOsrm(false);
    });

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen]);

  const startRace = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    const initial = initRacers();
    setRacers(initial);
    racersRef.current = initial;
    setIsRunning(true);
    setIsFinished(false);
    setDrawnRoutes({});
    setActiveAlgos(new Set(optResponse.results.map(r => r.algorithm)));
    finishCountRef.current = 0;
    startTimeRef.current = null;

    const maxRuntime = Math.max(...optResponse.results.map(r => r.runtime_ms));
    const RACE_DURATION = 5000;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;

      let allDone = true;
      const updatedRacers = racersRef.current.map(r => {
        if (r.finished) return r;
        const speed = maxRuntime / r.runtime_ms;
        const progress = Math.min((elapsed / RACE_DURATION) * speed, 1);
        const finished = progress >= 1;
        if (finished) {
          finishCountRef.current += 1;
          return { ...r, progress: 1, finished: true, finishOrder: finishCountRef.current };
        }
        allDone = false;
        return { ...r, progress };
      });

      racersRef.current = updatedRacers;
      setRacers([...updatedRacers]);

      const newDrawn: Record<string, [number, number][]> = {};
      updatedRacers.forEach(r => {
        const full = osrmRoutesRef.current[r.algorithm] || [];
        if (full.length === 0) return;
        const count = Math.floor(full.length * r.progress);
        newDrawn[r.algorithm] = full.slice(0, Math.max(count, 2));
      });
      setDrawnRoutes(newDrawn);

      if (allDone) {
        setIsFinished(true);
        setIsRunning(false);
        const finalDrawn: Record<string, [number, number][]> = {};
        updatedRacers.forEach(r => {
          finalDrawn[r.algorithm] = osrmRoutesRef.current[r.algorithm] || [];
        });
        setDrawnRoutes(finalDrawn);
        return;
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
  }, [initRacers, optResponse.results]);

  const skipAnimation = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    let order = 0;
    const sorted = [...optResponse.results].sort((a, b) => a.runtime_ms - b.runtime_ms);
    const orderMap: Record<string, number> = {};
    sorted.forEach(r => { order++; orderMap[r.algorithm] = order; });
    const skippedRacers = racersRef.current.map(r => ({
      ...r, progress: 1, finished: true, finishOrder: orderMap[r.algorithm] || 1,
    }));
    racersRef.current = skippedRacers;
    setRacers(skippedRacers);
    const finalDrawn: Record<string, [number, number][]> = {};
    skippedRacers.forEach(r => {
      finalDrawn[r.algorithm] = osrmRoutesRef.current[r.algorithm] || [];
    });
    setDrawnRoutes(finalDrawn);
    setIsFinished(true);
    setIsRunning(false);
    finishCountRef.current = optResponse.results.length;
  }, [optResponse.results]);

  const toggleAlgo = (algorithm: string) => {
    setActiveAlgos(prev => {
      const next = new Set(prev);
      if (next.has(algorithm)) {
        if (next.size === 1) return prev; // keep at least one active
        next.delete(algorithm);
      } else {
        next.add(algorithm);
      }
      return next;
    });
  };

  const winner = racers.find(r => r.finishOrder === 1);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[300] flex flex-col bg-[#0D1117] text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60 bg-[#161B22] shrink-0">
        <div className="flex items-center gap-3">
          <Flag size={20} className="text-cyan-400" />
          <h2 className="text-lg font-bold text-white">Algorithm Race Mode</h2>
          {isLoadingOsrm && (
            <span className="text-xs text-slate-400 animate-pulse">Fetching road data…</span>
          )}
          {isFinished && winner && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-sm font-semibold">
              <Trophy size={14} />
              {winner.algorithm} wins!
            </div>
          )}
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition">
          <X size={18} />
        </button>
      </div>

      {/* Map Area */}
      <div className="flex-1 flex flex-col min-h-0 p-4 gap-3">
        <div className="flex-1 rounded-2xl overflow-hidden border border-slate-700/60 min-h-0">
          <MapGL
            initialViewState={{
              longitude: mapCenter[0],
              latitude: mapCenter[1],
              zoom: 12,
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
          >
            {optResponse.results.map((r: AlgorithmResult) => {
              const coords = drawnRoutes[r.algorithm];
              if (!coords || coords.length < 2) return null;
              if (!activeAlgos.has(r.algorithm)) return null;
              const color = ALGO_COLORS[r.algorithm] || '#94a3b8';
              const geojson = {
                type: 'Feature' as const,
                properties: {},
                geometry: { type: 'LineString' as const, coordinates: coords },
              };
              return (
                <Source key={r.algorithm} id={`race-src-${r.algorithm}`} type="geojson" data={geojson}>
                  <Layer
                    id={`race-route-${r.algorithm}`}
                    type="line"
                    paint={{
                      'line-color': color,
                      'line-width': 3,
                      'line-opacity': 0.85,
                    }}
                    layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                  />
                </Source>
              );
            })}

            {optResponse.waypoints.map((wp, i) => (
              <Source
                key={`wp-${i}`}
                id={`wp-src-${i}`}
                type="geojson"
                data={{
                  type: 'Feature',
                  properties: {},
                  geometry: { type: 'Point', coordinates: [wp.lon, wp.lat] },
                }}
              >
                <Layer
                  id={`wp-circle-${i}`}
                  type="circle"
                  paint={{
                    'circle-radius': i === 0 ? 8 : 6,
                    'circle-color': i === 0 ? '#06b6d4' : '#475569',
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#0D1117',
                  }}
                />
              </Source>
            ))}
          </MapGL>
        </div>

        {/* Leaderboard Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 shrink-0">
          {[...racers]
            .sort((a, b) => (a.finishOrder || 99) - (b.finishOrder || 99))
            .map(racer => {
              const isActive = activeAlgos.has(racer.algorithm);
              return (
                <div
                  key={racer.algorithm}
                  onClick={() => toggleAlgo(racer.algorithm)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#161B22] cursor-pointer transition-all duration-150"
                  style={{
                    border: isActive
                      ? `1.5px solid ${racer.color}`
                      : '1.5px solid rgba(51,65,85,0.4)',
                    opacity: isActive ? 1 : 0.4,
                  }}
                >
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: racer.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-200 truncate">{racer.algorithm}</span>
                      {racer.finishOrder === 1 && <Trophy size={11} className="text-amber-400 shrink-0" />}
                      {racer.finished && racer.finishOrder > 1 && (
                        <span className="text-[10px] text-slate-500">#{racer.finishOrder}</span>
                      )}
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1 mt-1">
                      <div
                        className="h-1 rounded-full transition-all duration-100"
                        style={{ width: `${racer.progress * 100}%`, backgroundColor: racer.color }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-slate-300 font-mono shrink-0">{racer.runtime_ms.toFixed(2)}ms</span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-center gap-4 px-6 py-4 border-t border-slate-700/60 bg-[#161B22] shrink-0">
        {!isRunning && !isFinished && (
          <button
            onClick={startRace}
            disabled={isLoadingOsrm}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition flex items-center gap-2"
          >
            <Flag size={15} />
            {isLoadingOsrm ? 'Loading roads…' : 'Start Race'}
          </button>
        )}
        {isRunning && (
          <button
            onClick={skipAnimation}
            className="px-6 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-sm transition flex items-center gap-2"
          >
            <SkipForward size={15} />
            Skip Animation
          </button>
        )}
        {isFinished && (
          <>
            <button
              onClick={startRace}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-semibold text-sm transition flex items-center gap-2"
            >
              <Flag size={15} />
              Race Again
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-sm transition"
            >
              Back to Results
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
