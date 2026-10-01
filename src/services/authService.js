import api from './api';

// The calls that set, rotate or revoke the httpOnly refresh cookie need
// `withCredentials`, or the browser ignores Set-Cookie on a cross-origin
// response (and never sends the cookie back). It is set per call rather than
// on the shared client, so ordinary API calls never carry the cookie.
//
// /auth/refresh and /auth/logout also send `X-Requested-With: motive`: a custom
// header forces a CORS preflight, which the server answers only for allowed
// origins, so another site cannot make those two calls with the user's cookie.
const withCookie = { withCredentials: true };
const sameSiteHeader = { 'X-Requested-With': 'motive' };

// Uses the shared axios instance (baseURL + auth interceptor + silent refresh).
export const login = (credentials) => api.post('/api/auth/login', credentials, withCookie);
export const register = (data) => api.post('/api/auth/register', data, withCookie);
export const logout = () => api.post('/api/auth/logout', null, { ...withCookie, headers: sameSiteHeader });
export const forgotPassword = (email) => api.post('/api/auth/forgot-password', { email });
export const resetPassword = (token, password) => api.post('/api/auth/reset-password', { token, password });
// Native (Capacitor) Google sign-in hand-off — see hooks/useNativeOAuthCallback.js.
// `codeVerifier` is the PKCE verifier — see utils/pkce.js.
export const nativeExchange = (code, codeVerifier) =>
  api.post('/api/auth/native-exchange', { code, code_verifier: codeVerifier }, withCookie);
