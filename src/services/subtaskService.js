import api from './api';

export const getSubtasks = (taskId) => api.get(`/api/subtasks/${taskId}`);
export const createSubtask = (taskId, title) => api.post('/api/subtasks', { taskId, title });
export const updateSubtask = (id, patch) => api.put(`/api/subtasks/${id}`, patch);
export const deleteSubtask = (id) => api.delete(`/api/subtasks/${id}`);
