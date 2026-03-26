/**
 * src/App.tsx — Root router with all 6 application routes.
 * Phase 6: real Login/Register pages + ProtectedRoute guard.
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/ui/Layout';

import Dashboard from './pages/Dashboard';
import Deliveries from './pages/Deliveries';
import Riders from './pages/Riders';

// Placeholder pages — built in Phases 8-9
const Page = ({ name }: { name: string }) => (
  <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-indigo-400">{name}</h1>
      <p className="mt-2 text-gray-400">Phase 8–9 will build this page.</p>
    </div>
  </div>
);

const RouteOpt          = () => <Page name="Route Optimization" />;
const AlgoComp          = () => <Page name="Algorithm Comparison" />;

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes — ProtectedRoute redirects to /login if unauthenticated */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard"  element={<Dashboard />} />
        <Route path="/deliveries" element={<Deliveries />} />
        <Route path="/riders"     element={<Riders />} />
        <Route path="/routes"     element={<RouteOpt />} />
        <Route path="/algorithms" element={<AlgoComp />} />
      </Route>

      {/* Root: redirect to dashboard (ProtectedRoute will then redirect to /login if needed) */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
