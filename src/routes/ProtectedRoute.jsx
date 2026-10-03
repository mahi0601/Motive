import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogoMark } from '../components/ui/Logo';
import TermsGate from '../pages/Auth/TermsGate';

// A layout ROUTE (see AppRoutes.jsx) — gates every nested route on auth and
// renders an <Outlet/> once satisfied, instead of each protected page
// individually wrapping itself in <ProtectedRoute>.
const ProtectedRoute = () => {
  const { isAuthenticated, bootstrapping, user } = useAuth();

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

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // A brand-new Google account has not agreed to the Terms yet (it had no checkbox):
  // the app is not rendered at all until it does.
  if (user?.termsPending) return <TermsGate />;
  return <Outlet />;
};

export default ProtectedRoute;
