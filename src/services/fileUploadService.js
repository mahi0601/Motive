import api from './api';

// The route is /api/uploads (plural) -- this used to POST to /api/upload
// (singular), which doesn't exist, so every upload 404'd.
export const uploadFile = (file, taskId) => {
  const formData = new FormData();
  formData.append('file', file);
  if (taskId) formData.append('taskId', taskId);
  return api.post('/api/uploads', formData);
};

export const getTaskFiles = (taskId) => api.get(`/api/files/task/${taskId}`);
export const deleteFile = (id) => api.delete(`/api/files/${id}`);
