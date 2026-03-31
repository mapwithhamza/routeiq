/**
 * src/lib/api.ts — All API call functions for RouteIQ.
 * Uses the axios instance from ./axios.ts.
 */
import api from './axios';
import type {
  LoginRequest,
  RegisterRequest,
  User,
  Rider,
  RiderCreate,
  RiderUpdate,
  Delivery,
  DeliveryCreate,
  DeliveryUpdate,
  OptimizeRequest,
  OptimizeResponse,
  BenchmarkResult,
  AnalyticsSummary,
  AlgorithmRunSummary,
  Route,
} from '../types';

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: RegisterRequest) =>
    api.post<User>('/auth/register', data).then((r) => r.data),

  login: (data: LoginRequest) =>
    api.post<User>('/auth/login', data).then((r) => r.data),

  logout: () =>
    api.post('/auth/logout').then((r) => r.data),

  me: () =>
    api.get<User>('/auth/me').then((r) => r.data),
};

// ── Deliveries ───────────────────────────────────────────────────────────────

export const deliveriesApi = {
  list: () =>
    api.get<Delivery[]>('/deliveries').then((r) => r.data),

  create: (data: DeliveryCreate) =>
    api.post<Delivery>('/deliveries', data).then((r) => r.data),

  update: (id: number, data: DeliveryUpdate) =>
    api.put<Delivery>(`/deliveries/${id}`, data).then((r) => r.data),

  remove: (id: number) =>
    api.delete(`/deliveries/${id}`).then((r) => r.data),
};

// ── Riders ───────────────────────────────────────────────────────────────────

export const ridersApi = {
  list: () =>
    api.get<Rider[]>('/riders').then((r) => r.data),

  create: (data: RiderCreate) =>
    api.post<Rider>('/riders', data).then((r) => r.data),

  update: (id: number, data: RiderUpdate) =>
    api.put<Rider>(`/riders/${id}`, data).then((r) => r.data),

  remove: (id: number) =>
    api.delete(`/riders/${id}`).then((r) => r.data),
};

// ── Routes / Optimization ────────────────────────────────────────────────────

export const routesApi = {
  list: () =>
    api.get('/routes').then(r => r.data),

  optimize: (data: OptimizeRequest) =>
    api.post<OptimizeResponse>('/routes/optimize', data).then((r) => r.data),

  getRoute: (id: number) =>
    api.get<Route>(`/routes/${id}`).then((r) => r.data),

  benchmark: () =>
    api.post<BenchmarkResult[]>('/routes/benchmark').then((r) => r.data),
};

// ── Analytics ────────────────────────────────────────────────────────────────

export const analyticsApi = {
  summary: () =>
    api.get<AnalyticsSummary>('/analytics/summary').then((r) => r.data),

  algorithms: () =>
    api.get<AlgorithmRunSummary[]>('/analytics/algorithms').then((r) => r.data),
};
