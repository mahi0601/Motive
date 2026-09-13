import api from './api';

// Supersedes statsService.js — see PLAN §3. `/api/stats` is kept on the
// backend as a permanent alias for anything still pointed at it, but this is
// the endpoint the app itself talks to.
export const getMomentum = (period = 'week') => api.get('/api/momentum', { params: { period } });
