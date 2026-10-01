import api from './api';

export const getProfile = () => api.get('/api/users/me');
export const updateProfile = (data) => api.put('/api/users/me', data);

// Permanently delete the account + all data. Requires the current password.
// `credentials` is { password } for a password account, or { confirmEmail } for a
// Google-only account (see user.service.js#deleteAccount on the backend).
export const deleteAccount = (credentials) => api.delete('/api/users/me', { data: credentials });

// "Download my data": a JSON file of everything the account owns. Fetched as a
// blob (the request needs the Authorization header, so a plain link would not
// work) and handed to the browser as a download. Limited to once an hour.
export const downloadMyData = async () => {
  const res = await api.get('/api/users/me/export', { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `motive-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
