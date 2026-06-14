import api from './api';

export const getPages = (workspaceId) =>
  api.get('/api/pages', { params: workspaceId ? { workspaceId } : {} });

export const getPage = (id) => api.get(`/api/pages/${id}`);

export const createPage = (data) => api.post('/api/pages', data);

export const updatePage = (id, data) => api.patch(`/api/pages/${id}`, data);

export const deletePage = (id) => api.delete(`/api/pages/${id}`);

export const searchPages = (q) => api.get('/api/pages/search', { params: { q } });
