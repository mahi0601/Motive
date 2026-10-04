import api from './api';

export const listClientTemplates = () => api.get('/api/client-templates');
export const saveClientTemplate = (data) => api.post('/api/client-templates', data);
export const deleteClientTemplate = (id) => api.delete(`/api/client-templates/${id}`);
export const createClientFromTemplate = (id, data) => api.post(`/api/client-templates/${id}/use`, data);
