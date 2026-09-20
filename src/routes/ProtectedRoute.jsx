import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogoMark } from '../components/ui/Logo';

// A layout ROUTE (see AppRoutes.jsx) — gates every nested route on auth and
// renders an <Outlet/> once satisfied, instead of each protected page
// individually wrapping itself in <ProtectedRoute>.
const ProtectedRoute = () => {
  const { isAuthenticated, bootstrapping } = useAuth();

  // Wait for the silent-refresh bootstrap before deciding — avoids flashing
  // the login page for already-authenticated users on reload.
  if (bootstrapping) {
    return (
      <div className="flex h-screen items-center justify-center bg-light-background dark:bg-dark-background">
        <div className="animate-pulse">
          <LogoMark size={48} />
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
