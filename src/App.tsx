import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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

function App() {
  return (
    <AuthProvider>
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
              <ProtectedRoute allowedRoles={['admin', 'manager', 'operator']}>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vehicles"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'operator']}>
                <Layout>
                  <Vehicles />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/drivers"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'operator']}>
                <Layout>
                  <Drivers />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/trips"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'operator']}>
                <Layout>
                  <Trips />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/maintenance"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'operator']}>
                <Layout>
                  <Maintenance />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/fuel"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'operator']}>
                <Layout>
                  <Fuel />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <Layout>
                  <Expenses />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Driver Portal (Layout independent, mobile first) */}
          <Route
            path="/driver-portal"
            element={
              <ProtectedRoute allowedRoles={['driver', 'admin', 'manager', 'operator']}>
                <DriverPortal />
              </ProtectedRoute>
            }
          />

          {/* Fallback routing */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
