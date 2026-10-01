import api, { getCsrfToken } from './api';

// Uses the shared axios instance (baseURL + auth interceptor + silent refresh).
export const login = (credentials) => api.post('/api/auth/login', credentials);
export const register = (data) => api.post('/api/auth/register', data);
// The only two calls on this shared client that need the refresh cookie —
// withCredentials + the CSRF header are both set explicitly here rather
// than on the client itself (see api.js's own comment on why it isn't the
// default anymore).
export const logout = () =>
  api.post('/api/auth/logout', null, {
    withCredentials: true,
    headers: { 'X-CSRF-Token': getCsrfToken() },
  });
export const forgotPassword = (email) => api.post('/api/auth/forgot-password', { email });
export const resetPassword = (token, password) => api.post('/api/auth/reset-password', { token, password });
// Native (Capacitor) Google sign-in hand-off — see hooks/useNativeOAuthCallback.js.
// `codeVerifier` is the PKCE verifier — see utils/pkce.js.
export const nativeExchange = (code, codeVerifier) =>
  api.post('/api/auth/native-exchange', { code, code_verifier: codeVerifier });
