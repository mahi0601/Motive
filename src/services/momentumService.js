import api from './api';

// Supersedes the old statsService.js. The backend's `/api/stats` alias has
// been removed; `/api/momentum` is the only endpoint.
export const getMomentum = (period = 'week') => api.get('/api/momentum', { params: { period } });
