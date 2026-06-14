import api from './api';

export const getTemplates = () => api.get('/api/templates');

// Create a new page from a template (built-in key or custom id).
export const createPageFromTemplate = (id, parentId = null) =>
  api.post(`/api/templates/${id}/use`, { parentId });

// Save an existing page's blocks as a reusable custom template.
export const saveTemplate = ({ pageId, name, icon, description }) =>
  api.post('/api/templates', { pageId, name, icon, description });

export const deleteTemplate = (id) => api.delete(`/api/templates/${id}`);
