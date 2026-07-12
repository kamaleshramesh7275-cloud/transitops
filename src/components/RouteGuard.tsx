import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { AuthSession } from '../services/auth';

interface RouteGuardProps {
  children: React.ReactElement;
  allowedRoles?: ('fleet_manager' | 'dispatcher' | 'safety_officer' | 'financial_analyst' | 'driver')[];
}

// Returns the default landing page for each role
function getRoleHome(role: AuthSession['role']): string {
  switch (role) {
    case 'fleet_manager': return '/vehicles';
    case 'dispatcher': return '/dashboard';
    case 'safety_officer': return '/drivers';
    case 'financial_analyst': return '/reports';
    case 'driver': return '/driver-portal';
    default: return '/login';
  }
}

// Route accessible only if NOT logged in (e.g. Login)
export const PublicRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={getRoleHome(user.role)} replace />;
  }

  return children;
};

// Route accessible only if logged in
export const ProtectedRoute: React.FC<RouteGuardProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if role is allowed — redirect to the user's own home page, not a generic /dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getRoleHome(user.role)} replace />;
  }

  return children;
};
