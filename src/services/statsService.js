import api from './api';

export const getStats = (range = 'week') => api.get('/api/stats', { params: { range } });
