import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogoMark } from './Logo';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, bootstrapping } = useAuth();

  // Wait for the silent-refresh bootstrap before deciding — avoids flashing
  // the login page for already-authenticated users on reload.
  if (bootstrapping) {
    return (
      <div className="flex h-screen items-center justify-center bg-light-background dark:bg-dark-background">
        <div className="animate-spark-pulse">
          <LogoMark size={48} />
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
