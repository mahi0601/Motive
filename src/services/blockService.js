import api from './api';

export const getBlocks = (pageId) => api.get(`/api/pages/${pageId}/blocks`);

export const createBlock = (pageId, data) =>
  api.post(`/api/pages/${pageId}/blocks`, data);

export const updateBlock = (id, data) => api.patch(`/api/blocks/${id}`, data);

export const deleteBlock = (id) => api.delete(`/api/blocks/${id}`);

export const reorderBlocks = (pageId, order) =>
  api.put(`/api/pages/${pageId}/blocks/reorder`, { order });
