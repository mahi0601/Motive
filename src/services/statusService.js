import api from './api';

// Public, unauthenticated read of a workspace's shared status page — the
// token in the URL is the only credential. See status.controller.js on the
// backend for exactly what the response contains (titles, statuses and dates
// only — no people, descriptions or comments).
//
// `preview: true` is the owner looking at their own page from Settings: the page
// is identical, but the view isn't counted as a client looking.
export const getStatus = (token, { preview = false } = {}) =>
  api.get(`/api/status/${encodeURIComponent(token)}`, preview ? { params: { preview: 1 } } : undefined);

// The marketing page reports that a visitor arrived through a status page's
// "Powered by" link. Body-less on purpose: the server stores only a daily hash.
export const reportLandingFromStatus = () => api.post('/api/status/landing');

// A client's response from the public page (approve / request changes /
// comment). Unauthenticated: the link is the credential. See the backend's
// feedback.service.js for the limits, which the form also shows.
export const sendFeedback = (token, data) => api.post(`/api/status/${encodeURIComponent(token)}/feedback`, data);

// A client's request ("can you also do X?") from the public page. Unauthenticated, like
// feedback; the backend's request.service.js has the limits the form also shows.
export const sendRequest = (token, data) => api.post(`/api/status/${encodeURIComponent(token)}/requests`, data);
