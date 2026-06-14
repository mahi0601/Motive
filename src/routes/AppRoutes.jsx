import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import Calendar from '../pages/Calendar';
import Statistics from '../pages/Statistics';
import Settings from '../pages/Settings';
import Home from '../pages/Home';
import Profile from '../pages/Profile';
import Templates from '../pages/Templates';
import PageView from '../pages/PageView';
import BrandShowcase from '../pages/BrandShowcase';
import ProtectedRoute from '../components/ProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      {/* Protected — wait for session bootstrap, then gate on auth */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
      <Route path="/stats" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
      <Route path="/page/:id" element={<ProtectedRoute><PageView /></ProtectedRoute>} />

      <Route path="/brand" element={<BrandShowcase />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;
