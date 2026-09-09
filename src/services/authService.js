import api from './api';

// Uses the shared axios instance (baseURL + auth interceptor + silent refresh).
export const login = (credentials) => api.post('/api/auth/login', credentials);
export const register = (data) => api.post('/api/auth/register', data);
export const logout = () => api.post('/api/auth/logout');
export const forgotPassword = (email) => api.post('/api/auth/forgot-password', { email });
export const resetPassword = (token, password) => api.post('/api/auth/reset-password', { token, password });
// Native (Capacitor) Google sign-in hand-off — see hooks/useNativeOAuthCallback.js.
export const nativeExchange = (code) => api.post('/api/auth/native-exchange', { code });
