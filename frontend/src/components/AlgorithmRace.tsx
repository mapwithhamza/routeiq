/**
 * AlgorithmRace.tsx — Algorithm Race Mode
 * Animates all algorithms drawing their routes simultaneously.
 * Speed proportional to real runtime_ms from optimization results.
 */
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Trophy, SkipForward, Flag } from 'lucide-react';
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
  progress: number; // 0 to 1
  finished: boolean;
  finishOrder: number;
}

function getWaypointCoords(waypoints: Waypoint[]): { x: number; y: number; label: string }[] {
  if (waypoints.length === 0) return [];
  const lats = waypoints.map(w => w.lat);
  const lons = waypoints.map(w => w.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const padding = 60;
  const width = 800 - padding * 2;
  const height = 400 - padding * 2;
  return waypoints.map(w => ({
    x: maxLon === minLon ? padding + width / 2 : padding + ((w.lon - minLon) / (maxLon - minLon)) * width,
    y: maxLat === minLat ? padding + height / 2 : padding + height - ((w.lat - minLat) / (maxLat - minLat)) * height,
    label: w.label || '',
  }));
}

function interpolatePoint(
  coords: { x: number; y: number }[],
  route: number[],
  progress: number
): { x: number; y: number } {
  if (route.length < 2) return coords[route[0]] || { x: 0, y: 0 };
  const totalSegments = route.length - 1;
  const pos = progress * totalSegments;
  const segIndex = Math.min(Math.floor(pos), totalSegments - 1);
  const segProgress = pos - segIndex;
  const from = coords[route[segIndex]];
  const to = coords[route[segIndex + 1]];
  if (!from || !to) return coords[route[0]];
  return {
    x: from.x + (to.x - from.x) * segProgress,
    y: from.y + (to.y - from.y) * segProgress,
  };
}

export default function AlgorithmRace({ isOpen, onClose, optResponse }: AlgorithmRaceProps) {
  const [racers, setRacers] = useState<RacerState[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [, setFinishCount] = useState(0);
  const [, setSkipped] = useState(false);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const finishCountRef = useRef(0);

  const coords = getWaypointCoords(optResponse.waypoints);

  const initRacers = (): RacerState[] =>
    optResponse.results.map((r: AlgorithmResult) => ({
      algorithm: r.algorithm,
      color: ALGO_COLORS[r.algorithm] || '#94a3b8',
      runtime_ms: r.runtime_ms,
      distance: r.distance,
      route: r.route,
      progress: 0,
      finished: false,
      finishOrder: 0,
    }));

  useEffect(() => {
    if (isOpen) {
      setRacers(initRacers());
      setIsRunning(false);
      setIsFinished(false);
      setFinishCount(0);
      setSkipped(false);
      finishCountRef.current = 0;
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen]);

  const startRace = () => {
    setIsRunning(true);
    setIsFinished(false);
    setFinishCount(0);
    finishCountRef.current = 0;
    setRacers(initRacers());
    startTimeRef.current = null;

    const maxRuntime = Math.max(...optResponse.results.map(r => r.runtime_ms));
    const RACE_DURATION = 4000; // 4 seconds total race

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;

      setRacers(prev => {
        let allDone = true;
        const updated = prev.map(r => {
          if (r.finished) return r;
          const speed = maxRuntime / r.runtime_ms;
          const progress = Math.min((elapsed / RACE_DURATION) * speed, 1);
          const finished = progress >= 1;
          if (finished && !r.finished) {
            finishCountRef.current += 1;
            return { ...r, progress: 1, finished: true, finishOrder: finishCountRef.current };
          }
          if (!finished) allDone = false;
          return { ...r, progress };
        });
        if (allDone) {
          setIsFinished(true);
          setIsRunning(false);
          setFinishCount(finishCountRef.current);
        }
        return updated;
      });

      if (elapsed < RACE_DURATION * 3) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  };

  const skipAnimation = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    let order = 0;
    const sorted = [...optResponse.results].sort((a: AlgorithmResult, b: AlgorithmResult) => a.runtime_ms - b.runtime_ms);
    const orderMap: Record<string, number> = {};
    sorted.forEach((r: AlgorithmResult) => { order++; orderMap[r.algorithm] = order; });
    setRacers(prev => prev.map(r => ({
      ...r, progress: 1, finished: true, finishOrder: orderMap[r.algorithm] || 1,
    })));
    setIsFinished(true);
    setIsRunning(false);
    setSkipped(true);
    finishCountRef.current = optResponse.results.length;
    setFinishCount(optResponse.results.length);
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

      {/* Canvas Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 min-h-0">
        {/* SVG Race Track */}
        <div className="w-full max-w-4xl bg-[#161B22] rounded-2xl border border-slate-700/60 overflow-hidden">
          <svg viewBox="0 0 800 400" className="w-full" style={{ height: '380px' }}>
            {/* Background grid */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="800" height="400" fill="url(#grid)" />

            {/* Base route lines (faint) */}
            {optResponse.results[0] && coords.length > 0 && (
              <polyline
                points={optResponse.results[0].route.map((i: number) => `${coords[i]?.x},${coords[i]?.y}`).join(' ')}
                fill="none"
                stroke="#1e293b"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            )}

            {/* Each algorithm's animated path */}
            {racers.map(racer => {
              if (racer.route.length < 2 || coords.length === 0) return null;
              const totalSegments = racer.route.length - 1;
              const pos = racer.progress * totalSegments;
              const fullSegments = Math.floor(pos);

              const drawnPoints: string[] = [];
              for (let i = 0; i <= fullSegments && i < racer.route.length; i++) {
                const c = coords[racer.route[i]];
                if (c) drawnPoints.push(`${c.x},${c.y}`);
              }

              const currentPos = interpolatePoint(coords, racer.route, racer.progress);

              return (
                <g key={racer.algorithm}>
                  {drawnPoints.length > 1 && (
                    <polyline
                      points={drawnPoints.join(' ')}
                      fill="none"
                      stroke={racer.color}
                      strokeWidth="2.5"
                      strokeOpacity="0.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  {/* Moving dot */}
                  {!racer.finished && racer.progress > 0 && (
                    <circle cx={currentPos.x} cy={currentPos.y} r="5" fill={racer.color} opacity="0.9">
                    </circle>
                  )}
                  {/* Finish marker */}
                  {racer.finished && racer.finishOrder === 1 && (
                    <circle cx={coords[racer.route[racer.route.length - 1]]?.x} cy={coords[racer.route[racer.route.length - 1]]?.y} r="8" fill={racer.color} opacity="1" />
                  )}
                </g>
              );
            })}

            {/* Waypoint dots */}
            {coords.map((c, i) => (
              <g key={i}>
                <circle cx={c.x} cy={c.y} r="6" fill={i === 0 ? '#06b6d4' : '#475569'} stroke="#0D1117" strokeWidth="2" />
                <text x={c.x} y={c.y - 10} textAnchor="middle" fontSize="9" fill="#94a3b8">
                  {i === 0 ? 'START' : i.toString()}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Racer Legend / Leaderboard */}
        <div className="w-full max-w-4xl grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[...racers]
            .sort((a, b) => (a.finishOrder || 99) - (b.finishOrder || 99))
            .map(racer => (
              <div
                key={racer.algorithm}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#161B22] border border-slate-700/40"
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
                <span className="text-[10px] text-slate-500 font-mono shrink-0">{racer.runtime_ms.toFixed(2)}ms</span>
              </div>
            ))}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-center gap-4 px-6 py-4 border-t border-slate-700/60 bg-[#161B22] shrink-0">
        {!isRunning && !isFinished && (
          <button
            onClick={startRace}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-semibold text-sm transition flex items-center gap-2"
          >
            <Flag size={15} />
            Start Race
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
