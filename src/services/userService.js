import api from './api';

export const getProfile = () => api.get('/api/users/me');
export const updateProfile = (data) => api.put('/api/users/me', data);

// Permanently delete the account + all data. Requires the current password.
export const deleteAccount = (password) => api.delete('/api/users/me', { data: { password } });
