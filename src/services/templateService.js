import api from './api';

export const getTemplates = () => api.get('/api/templates');

// Create a new page from a template (built-in key or custom id), in the given
// workspace (the backend falls back to the user's default when omitted).
export const createPageFromTemplate = (id, parentId = null, workspaceId) =>
  api.post(`/api/templates/${id}/use`, { parentId, workspaceId });

// Save an existing page's blocks as a reusable custom template.
export const saveTemplate = ({ pageId, name, icon, description }) =>
  api.post('/api/templates', { pageId, name, icon, description });

export const deleteTemplate = (id) => api.delete(`/api/templates/${id}`);
