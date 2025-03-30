import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import TaskDetail from '../pages/TaskDetail';
import Calendar from '../pages/Calendar';
import Statistics from '../pages/Statistics';
import Settings from '../pages/Settings';
import TaskBoard from '../pages/TaskBoard';
import Home from '../pages/Home';
import Profile from '../pages/Profile';
import TemplateBuilder from '../templates/TemplateBuilder';

const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={isAuthenticated() ? <Dashboard /> : <Navigate to="/login" />} />
      <Route path="/task/:id" element={isAuthenticated() ? <TaskDetail /> : <Navigate to="/login" />} />
      <Route path="/calendar" element={isAuthenticated() ? <Calendar /> : <Navigate to="/login" />} />
      <Route path="/stats" element={isAuthenticated() ? <Statistics /> : <Navigate to="/login" />} />
      <Route path="/settings" element={isAuthenticated() ? <Settings /> : <Navigate to="/login" />} />
      <Route path="/task" element={isAuthenticated() ? <TaskBoard /> : <Navigate to="/login" />} />
      <Route path="/profile" element={isAuthenticated() ? <Profile /> : <Navigate to="/login" />} />
      <Route path="/templates" element={isAuthenticated() ? <TemplateBuilder /> : <Navigate to="/login" />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;

