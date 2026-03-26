/**
 * src/App.tsx — Root router with all 6 application routes.
 * Pages are lazy-loaded placeholders; full UI built in Phases 6-9.
 */
import { Routes, Route, Navigate } from 'react-router-dom';

// Placeholder page component factory
const Page = ({ name }: { name: string }) => (
  <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-indigo-400">{name}</h1>
      <p className="mt-2 text-gray-400">Phase 6–9 will build this page.</p>
    </div>
  </div>
);

// Route definitions — all 6 required pages
const Login       = () => <Page name="Login" />;
const Dashboard   = () => <Page name="Dashboard" />;
const Deliveries  = () => <Page name="Deliveries" />;
const Riders      = () => <Page name="Riders" />;
const RouteOpt    = () => <Page name="Route Optimization" />;
const AlgoComp    = () => <Page name="Algorithm Comparison" />;

export default function App() {
  return (
    <Routes>
      {/* Root → redirect to /dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login"       element={<Login />} />
      <Route path="/dashboard"   element={<Dashboard />} />
      <Route path="/deliveries"  element={<Deliveries />} />
      <Route path="/riders"      element={<Riders />} />
      <Route path="/routes"      element={<RouteOpt />} />
      <Route path="/algorithms"  element={<AlgoComp />} />
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
