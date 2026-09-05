import api from './api';

export const getActivity = (params = {}) => api.get('/api/activity', { params });
