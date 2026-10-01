import api from './api';

// Public, unauthenticated read of a workspace's shared status page — the
// token in the URL is the only credential. See status.controller.js on the
// backend for exactly what the response contains (titles, statuses and dates
// only — no people, descriptions or comments).
export const getStatus = (token) => api.get(`/api/status/${encodeURIComponent(token)}`);
