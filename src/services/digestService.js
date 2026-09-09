import api from './api';

export const getDailyDigest = () => api.get('/api/digest');
