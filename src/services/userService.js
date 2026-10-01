import api from './api';

export const getProfile = () => api.get('/api/users/me');
export const updateProfile = (data) => api.put('/api/users/me', data);

// Permanently delete the account + all data. Requires the current password.
// `credentials` is { password } for a password account, or { confirmEmail } for a
// Google-only account (see user.service.js#deleteAccount on the backend).
export const deleteAccount = (credentials) => api.delete('/api/users/me', { data: credentials });
