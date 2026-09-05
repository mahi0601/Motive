import api from './api';

export const getNotifications = () => api.get('/api/notifications');

export const markNotificationRead = (id) => api.put(`/api/notifications/${id}/read`);

export const clearNotifications = () => api.delete('/api/notifications/clear');
