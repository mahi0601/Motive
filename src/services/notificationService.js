import api from './api';

// `/api/notifications` is paginated (`{ items, pagination, unreadCount }`) —
// pass `{ limit }` etc. through `params` if a caller ever needs more than
// the default page.
export const getNotifications = (params) => api.get('/api/notifications', { params });

export const markNotificationRead = (id) => api.put(`/api/notifications/${id}/read`);

export const clearNotifications = () => api.delete('/api/notifications/clear');
