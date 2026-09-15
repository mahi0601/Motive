import axios from 'axios';
import { logger } from '../utils/logger';

// ── In-memory access token ──────────────────────────────
// Kept in a module variable, NEVER in localStorage → not reachable by XSS.
// Lost on full page reload; restored via a silent /auth/refresh (httpOnly cookie).
let accessToken = null;
export const setAccessToken = (t) => {
  accessToken = t;
};
export const getAccessToken = () => accessToken;
export const clearAccessToken = () => {
  accessToken = null;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // send the refresh cookie to /auth/* endpoints
});

// Attach the in-memory access token to every request.
api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// ── Silent refresh + retry on 401 ───────────────────────
const AUTH_PATHS = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh'];
let refreshPromise = null; // de-dupes concurrent refreshes

// Bare client (no interceptors) so the refresh call can't recurse.
const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

export const refreshSession = async () => {
  const { data } = await refreshClient.post('/api/auth/refresh');
  setAccessToken(data.accessToken);
  return data; // { user, accessToken }
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const isAuthCall = AUTH_PATHS.some((p) => original?.url?.includes(p));

    // Only attempt a single silent refresh per request, and never for auth calls.
    if (status === 401 && original && !original._retried && !isAuthCall) {
      original._retried = true;
      try {
        refreshPromise = refreshPromise || refreshSession().finally(() => {
          refreshPromise = null;
        });
        await refreshPromise;
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original); // replay the original request
      } catch (refreshError) {
        // Was a fully silent `catch {}` — a real refresh failure (network
        // error, expired session, server down) had zero trace anywhere.
        logger.warn('Silent token refresh failed — redirecting to login', {
          status: refreshError.response?.status,
        });
        clearAccessToken();
        if (window.location.pathname !== '/login') {
          window.location.assign('/login');
        }
      }
    }
    // The single chokepoint for every other API failure (403/404/422/5xx,
    // network/timeout/CORS) — previously logged nowhere. This is what
    // covers the overwhelming majority of what used to be ~40 individual
    // per-call-site console.error calls scattered across the app.
    logger.error('API request failed', error, {
      method: original?.method,
      url: original?.url,
      status,
    });
    return Promise.reject(error);
  }
);

export default api;
