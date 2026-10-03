import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
const Dashboard = lazyWithRetry(() => import('../pages/Dashboard'));
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
const ForgotPassword = lazyWithRetry(() => import('../pages/Auth/ForgotPassword'));
const ResetPassword = lazyWithRetry(() => import('../pages/Auth/ResetPassword'));
const VerifyEmail = lazyWithRetry(() => import('../pages/Auth/VerifyEmail'));
const Calendar = lazyWithRetry(() => import('../pages/Calendar'));
const Momentum = lazyWithRetry(() => import('../pages/Momentum'));
const Settings = lazyWithRetry(() => import('../pages/Settings'));
import Home from '../pages/Home';
const Profile = lazyWithRetry(() => import('../pages/Profile'));
const Templates = lazyWithRetry(() => import('../pages/Templates'));
const PageView = lazyWithRetry(() => import('../pages/PageView'));
const Privacy = lazyWithRetry(() => import('../pages/Privacy'));
const Terms = lazyWithRetry(() => import('../pages/Terms'));
const Invite = lazyWithRetry(() => import('../pages/Invite'));
const StatusPage = lazyWithRetry(() => import('../pages/StatusPage'));
const Demo = lazyWithRetry(() => import('../pages/Demo'));
import PageFallback from '../components/ui/PageFallback';
import { lazyWithRetry } from '../utils/lazyWithRetry';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../layout/DashboardLayout';
import AuthLayout from '../layout/AuthLayout';

// Pages are code-split (lazyWithRetry), so a visitor downloads only the screen
// they open — the charts library behind Momentum, for example, no longer loads
// for everyone. Home, Login and Register stay in the main bundle: they are the
// first thing a new visitor sees. Each layout wraps its <Outlet/> in a Suspense
// boundary, so changing pages keeps the shell on screen.
// DashboardLayout/AuthLayout/ProtectedRoute are all layout ROUTES (each
// renders an <Outlet/>) — the shell/auth-gate is applied once per group
// here, instead of every page individually wrapping itself.
const AppRoutes = () => {
  return (
    <Suspense fallback={<PageFallback />}>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      {/* Deliberately outside ProtectedRoute and AuthLayout — it has to work
          for someone with no account yet, and handles its own
          authenticated/unauthenticated branching (see Invite.jsx). */}
      <Route path="/invite/:token" element={<Invite />} />
      {/* Public, read-only client status page — the share token in the URL
          is the only credential (see StatusPage.jsx). */}
      <Route path="/s/:token" element={<StatusPage />} />
      {/* A public example page with made-up data, linked from the home page. */}
      <Route path="/demo" element={<Demo />} />
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
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
    </Suspense>
  );
};

export default AppRoutes;
