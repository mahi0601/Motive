import api from './api';

// Uses the shared axios instance (baseURL + auth interceptor + silent refresh).
export const login = (credentials) => api.post('/api/auth/login', credentials);
export const register = (data) => api.post('/api/auth/register', data);
export const logout = () => api.post('/api/auth/logout');
