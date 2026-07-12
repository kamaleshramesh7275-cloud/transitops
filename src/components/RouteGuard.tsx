import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface RouteGuardProps {
  children: React.ReactElement;
  allowedRoles?: ('admin' | 'manager' | 'operator' | 'driver')[];
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
    // Redirect drivers directly to their portal, others to dashboard
    const target = user.role === 'driver' ? '/driver-portal' : '/dashboard';
    return <Navigate to={target} replace />;
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

  // Check if role is allowed
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If user is a driver, redirect to driver portal
    if (user.role === 'driver') {
      return <Navigate to="/driver-portal" replace />;
    }
    // Otherwise redirect to main dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
