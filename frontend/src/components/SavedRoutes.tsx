/**
 * SavedRoutes.tsx — Saved Routes panel for Route Optimization page.
 * Lists all previously optimized routes, click to restore.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { routesApi } from '../lib/api';
import type { SavedRoute, OptimizeResponse, Waypoint, AlgorithmResult } from '../types';
import Spinner from './ui/Spinner';

interface SavedRoutesProps {
  onRestore: (response: OptimizeResponse) => void;
}

export default function SavedRoutes({ onRestore }: SavedRoutesProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: routes, isLoading } = useQuery({
    queryKey: ['routes'],
    queryFn: routesApi.list,
    enabled: isOpen,
  });

  const handleRestore = (route: SavedRoute) => {
    if (!route.waypoints_json || !route.algorithm_results_json) return;
    try {
      const waypoints: Waypoint[] = JSON.parse(route.waypoints_json);
      const results: AlgorithmResult[] = JSON.parse(route.algorithm_results_json);
      const response: OptimizeResponse = {
        route_id: route.id,
        name: route.name,
        waypoints,
        results,
      };
      onRestore(response);
      setIsOpen(false);
    } catch {
      console.error('Failed to parse saved route');
    }
  };

  return (
    <div className="rounded-xl shadow-md dark:shadow-none border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#1C2128] overflow-hidden shrink-0">
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/20 transition"
      >
        <div className="flex items-center gap-2">
          <History size={14} className="text-gray-500 dark:text-slate-400" />
          <span className="text-sm font-semibold text-gray-800 dark:text-slate-200">Saved Routes</span>
        </div>
        {isOpen ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>

      {isOpen && (
        <div className="border-t border-gray-200 dark:border-slate-700/50 max-h-[220px] overflow-y-auto">
          {isLoading && (
            <div className="flex justify-center py-4">
              <Spinner className="h-5 w-5 text-cyan-500" />
            </div>
          )}
          {!isLoading && (!routes || routes.length === 0) && (
            <p className="text-xs text-gray-400 dark:text-slate-500 text-center py-4">
              No saved routes yet.
            </p>
          )}
          {!isLoading && routes && routes.map(route => (
            <div
              key={route.id}
              className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-700/20 transition border-b border-gray-100 dark:border-slate-700/30 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 truncate">{route.name}</p>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
                  {new Date(route.created_at).toLocaleDateString()} · {new Date(route.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {route.waypoints_json && route.algorithm_results_json && (
                <button
                  onClick={() => handleRestore(route)}
                  className="ml-3 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30 hover:bg-cyan-100 dark:hover:bg-cyan-500/25 transition shrink-0"
                >
                  <RotateCcw size={10} />
                  Restore
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
