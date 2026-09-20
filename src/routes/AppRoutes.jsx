import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import ForgotPassword from '../pages/Auth/ForgotPassword';
import ResetPassword from '../pages/Auth/ResetPassword';
import Calendar from '../pages/Calendar';
import Momentum from '../pages/Momentum';
import Settings from '../pages/Settings';
import Home from '../pages/Home';
import Profile from '../pages/Profile';
import Templates from '../pages/Templates';
import PageView from '../pages/PageView';
import Privacy from '../pages/Privacy';
import Invite from '../pages/Invite';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../layout/DashboardLayout';
import AuthLayout from '../layout/AuthLayout';

// DashboardLayout/AuthLayout/ProtectedRoute are all layout ROUTES (each
// renders an <Outlet/>) — the shell/auth-gate is applied once per group
// here, instead of every page individually wrapping itself.
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/privacy" element={<Privacy />} />
      {/* Deliberately outside ProtectedRoute and AuthLayout — it has to work
          for someone with no account yet, and handles its own
          authenticated/unauthenticated branching (see Invite.jsx). */}
      <Route path="/invite/:token" element={<Invite />} />
      {/* Permanent alias: "Statistics" was renamed to "Momentum" (see
          config/nav.js). Kept indefinitely, not just "one release" — an
          installed PWA can keep an old service-worker-cached shell for a
          long time, and any bookmark/external link to /stats should still
          land somewhere. */}
      <Route path="/stats" element={<Navigate to="/momentum" replace />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/momentum" element={<Momentum />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/page/:id" element={<PageView />} />
        </Route>
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;
