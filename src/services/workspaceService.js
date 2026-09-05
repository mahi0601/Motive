import api from './api';

export const getWorkspaces = () => api.get('/api/workspaces');
export const createWorkspace = (data) => api.post('/api/workspaces', data);
export const inviteMember = (workspaceId, email) =>
  api.post(`/api/workspaces/${workspaceId}/members`, { email });
