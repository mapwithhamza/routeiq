/**
 * src/types/index.ts — TypeScript interfaces mirroring backend Pydantic schemas.
 */

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  role: 'admin' | 'dispatcher' | 'rider';
  is_active: boolean;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

// ── Rider ─────────────────────────────────────────────────────────────────────

export interface Rider {
  id: number;
  name: string;
  phone: string | null;
  vehicle_type: string | null;
  status: 'available' | 'on_route' | 'offline';
  current_lat: number | null;
  current_lon: number | null;
  created_at: string;
}

export interface RiderCreate {
  name: string;
  phone?: string | null;
  vehicle_type?: string | null;
  current_lat?: number | null;
  current_lon?: number | null;
}

export interface RiderUpdate extends Partial<RiderCreate> {
  status?: 'available' | 'on_route' | 'offline';
}

// ── Delivery ──────────────────────────────────────────────────────────────────

export type DeliveryStatus = 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'failed';
export type DeliveryPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Delivery {
  id: number;
  title: string;
  address: string | null;
  lat: number;
  lon: number;
  priority: DeliveryPriority;
  status: DeliveryStatus;
  rider_id: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface DeliveryCreate {
  title: string;
  address?: string | null;
  lat: number;
  lon: number;
  priority?: DeliveryPriority;
  rider_id?: number | null;
  notes?: string | null;
}

export interface DeliveryUpdate extends Partial<DeliveryCreate> {
  status?: DeliveryStatus;
}

// ── Route ─────────────────────────────────────────────────────────────────────

export type RouteStatus = 'active' | 'completed' | 'cancelled';

export interface Route {
  id: number;
  name: string;
  rider_id: number | null;
  status: RouteStatus;
  created_at: string;
}

export interface Waypoint {
  lat: number;
  lon: number;
  label?: string | null;
}

export interface AlgorithmResult {
  algorithm: string;
  route: number[];
  distance: number;
  time: number;
  nodes_explored: number;
  runtime_ms: number;
}

export interface OptimizeRequest {
  name?: string;
  rider_id?: number | null;
  waypoints: Waypoint[];
}

export interface OptimizeResponse {
  route_id: number;
  name: string;
  waypoints: Waypoint[];
  results: AlgorithmResult[];
}

export interface BenchmarkResult {
  algorithm: string;
  nodes: number;
  distance_km?: number | null;
  runtime_ms: number;
  nodes_explored?: number;
  route_length?: number;
  // NetworkX validation rows
  our_distance_km?: number;
  nx_distance_km?: number;
  delta_km?: number;
  valid?: boolean;
  error?: string;
}

// ── Analytics ────────────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  total_deliveries: number;
  pending: number;
  in_transit: number;
  delivered: number;
  failed: number;
  total_riders: number;
  active_riders: number;
  routes_optimized: number;
  avg_distance: number;
}

export interface AlgorithmRunSummary {
  id: number;
  route_id: number;
  algorithm_name: string;
  distance_km: number | null;
  duration_min: number | null;
  nodes_explored: number | null;
  runtime_ms: number | null;
  created_at: string;
}
