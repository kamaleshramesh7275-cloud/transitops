import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { PublicRoute, ProtectedRoute } from './components/RouteGuard';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Vehicles } from './pages/Vehicles';
import { Drivers } from './pages/Drivers';
import { Trips } from './pages/Trips';
import { Maintenance } from './pages/Maintenance';
import { Fuel } from './pages/Fuel';
import { Expenses } from './pages/Expenses';
import { Reports } from './pages/Reports';
import { DriverPortal } from './pages/DriverPortal';
import { LiveTracking } from './pages/LiveTracking';
import { DriverTracking } from './pages/DriverTracking';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />

            {/* Administrative Portal (Requires layout sidebar) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['dispatcher', 'fleet_manager', 'safety_officer', 'financial_analyst']}>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehicles"
              element={
                <ProtectedRoute allowedRoles={['fleet_manager']}>
                  <Layout>
                    <Vehicles />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/drivers"
              element={
                <ProtectedRoute allowedRoles={['safety_officer']}>
                  <Layout>
                    <Drivers />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/trips"
              element={
                <ProtectedRoute allowedRoles={['dispatcher']}>
                  <Layout>
                    <Trips />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tracking"
              element={
                <ProtectedRoute allowedRoles={['dispatcher']}>
                  <Layout>
                    <DriverTracking />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/maintenance"
              element={
                <ProtectedRoute allowedRoles={['fleet_manager']}>
                  <Layout>
                    <Maintenance />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/fuel"
              element={
                <ProtectedRoute allowedRoles={['financial_analyst']}>
                  <Layout>
                    <Fuel />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <ProtectedRoute allowedRoles={['financial_analyst']}>
                  <Layout>
                    <Expenses />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={['financial_analyst']}>
                  <Layout>
                    <Reports />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Live Tracking */}
            <Route
              path="/tracking"
              element={
                <ProtectedRoute allowedRoles={['dispatcher']}>
                  <Layout>
                    <LiveTracking />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Driver Portal (Layout independent, mobile first) */}
            <Route
              path="/driver-portal"
              element={
                <ProtectedRoute allowedRoles={['driver']}>
                  <DriverPortal />
                </ProtectedRoute>
              }
            />

            {/* Fallback routing */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
