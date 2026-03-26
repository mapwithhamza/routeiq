/**
 * src/App.tsx — Root router with all 6 application routes.
 * Phase 6: real Login/Register pages + ProtectedRoute guard.
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';

// Placeholder pages — built in Phases 7-9
const Page = ({ name }: { name: string }) => (
  <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-indigo-400">{name}</h1>
      <p className="mt-2 text-gray-400">Phase 7–9 will build this page.</p>
    </div>
  </div>
);

const Dashboard         = () => <Page name="Dashboard" />;
const Deliveries        = () => <Page name="Deliveries" />;
const Riders            = () => <Page name="Riders" />;
const RouteOpt          = () => <Page name="Route Optimization" />;
const AlgoComp          = () => <Page name="Algorithm Comparison" />;

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes — ProtectedRoute redirects to /login if unauthenticated */}
      <Route path="/dashboard"  element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/deliveries" element={<ProtectedRoute><Deliveries /></ProtectedRoute>} />
      <Route path="/riders"     element={<ProtectedRoute><Riders /></ProtectedRoute>} />
      <Route path="/routes"     element={<ProtectedRoute><RouteOpt /></ProtectedRoute>} />
      <Route path="/algorithms" element={<ProtectedRoute><AlgoComp /></ProtectedRoute>} />

      {/* Root: redirect to dashboard (ProtectedRoute will then redirect to /login if needed) */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
