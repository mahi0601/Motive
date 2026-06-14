import api from './api';

// Uses the shared axios instance (baseURL + auth token + silent refresh).
export const getTasks = (params = {}) => api.get('/api/tasks', { params });
export const createTask = (task) => api.post('/api/tasks', task);
export const updateTask = (id, task) => api.patch(`/api/tasks/${id}`, task);
export const deleteTask = (id) => api.delete(`/api/tasks/${id}`);
