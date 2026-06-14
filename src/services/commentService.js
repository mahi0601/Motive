import api from './api';

export const getComments = (taskId) => api.get(`/api/comments/${taskId}`);
export const addComment = (taskId, comment) =>
  api.post(`/api/comments/${taskId}`, { comment });
