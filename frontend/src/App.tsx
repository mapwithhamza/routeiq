/**
 * src/App.tsx — Root router with all 6 application routes.
 * Phase 6: real Login/Register pages + ProtectedRoute guard.
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/ui/Layout';

import Dashboard from './pages/Dashboard';
import Deliveries from './pages/Deliveries';
import Riders from './pages/Riders';
import RouteOptimization from './pages/RouteOptimization';
import AlgorithmComparison from './pages/AlgorithmComparison';

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Protected routes — ProtectedRoute redirects to /login if unauthenticated */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard"  element={<Dashboard />} />
        <Route path="/deliveries" element={<Deliveries />} />
        <Route path="/riders"     element={<Riders />} />
        <Route path="/routes"     element={<RouteOptimization />} />
        <Route path="/algorithms" element={<AlgorithmComparison />} />
      </Route>

      {/* Root: redirect to dashboard (ProtectedRoute will then redirect to /login if needed) */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
