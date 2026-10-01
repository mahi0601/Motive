import api from './api';

// Public, unauthenticated read of a workspace's shared status page — the
// token in the URL is the only credential. See status.controller.js on the
// backend for exactly what the response contains (titles, statuses and dates
// only — no people, descriptions or comments).
export const getStatus = (token) => api.get(`/api/status/${encodeURIComponent(token)}`);

// A client's response from the public page (approve / request changes /
// comment). Unauthenticated: the link is the credential. See the backend's
// feedback.service.js for the limits, which the form also shows.
export const sendFeedback = (token, data) => api.post(`/api/status/${encodeURIComponent(token)}/feedback`, data);
