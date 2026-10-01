import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setAccessToken, clearAccessToken, setCsrfToken, clearCsrfToken, refreshSession } from '../services/api';
import { logout as logoutRequest } from '../services/authService';
import { getProfile } from '../services/userService';
import { logger } from '../utils/logger';

// The Google web-login redirect (backend's auth.controller.js#googleCallback)
// can't hand the CSRF token back in a JSON body like every other login path
// — it's a top-level navigation, not an AJAX response — so it rides the
// redirect URL instead, once. Picked up here before the very first
// /refresh call and stripped from the address bar immediately; it's inert
// on its own (the httpOnly cookie is what actually authenticates anything)
// and is replaced by a fresh one from that same refresh response either way.
function consumeCsrfFromUrl() {
  const url = new URL(window.location.href);
  const csrf = url.searchParams.get('csrf');
  if (!csrf) return null;
  url.searchParams.delete('csrf');
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  return csrf;
}

const AuthContext = createContext();

// Mirror the (non-sensitive) user profile to localStorage for instant UI hydration.
// The access token is NEVER stored here — only this profile object.
const persistUser = (u) => {
  if (u) localStorage.setItem('user', JSON.stringify(u));
  else localStorage.removeItem('user');
};

export const AuthProvider = ({ children }) => {
  // Start unauthenticated; the real state is established by the bootstrap
  // refresh below. (Don't trust a stale localStorage user — it would make
  // isAuthenticated briefly true and fire premature, unauthenticated API calls.)
  const [user, setUserState] = useState(null);
  const setUser = (u) => {
    persistUser(u);
    setUserState(u);
  };
  // `bootstrapping` is true until we've tried to restore the session on load,
  // so protected routes can wait instead of flashing the login page.
  const [bootstrapping, setBootstrapping] = useState(true);

  // On app start, try to restore the session from the refresh cookie.
  useEffect(() => {
    let active = true;
    (async () => {
      const csrfFromUrl = consumeCsrfFromUrl();
      if (csrfFromUrl) setCsrfToken(csrfFromUrl);
      try {
        const { user: restored } = await refreshSession();
        if (active) setUser(restored);
      } catch (err) {
        // Routine for a logged-out visitor (no refresh cookie yet) — warn,
        // not error, so this doesn't report to Sentry on every anonymous
        // page load. Was fully silent before; this at least makes a
        // genuinely unexpected bootstrap failure (not just "no cookie")
        // visible in dev.
        logger.warn('Session bootstrap refresh failed', { status: err.response?.status });
        if (active) setUser(null);
      } finally {
        if (active) setBootstrapping(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Called by Login/Register/native-OAuth after a successful response.
  const login = useCallback((userData, accessToken, csrfToken) => {
    setAccessToken(accessToken);
    setCsrfToken(csrfToken);
    setUser(userData);
  }, []);

  // Re-fetch the current user profile from the server — e.g. after returning
  // from Stripe Checkout, to pick up the `isPro` flag the webhook just set.
  const refreshUser = useCallback(async () => {
    const { data } = await getProfile();
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest(); // revokes refresh token + clears cookie
    } catch {
      /* best effort */
    }
    clearAccessToken();
    clearCsrfToken();
    setUser(null);
    window.location.assign('/login');
  }, []);

  return (
    <AuthContext.Provider value={{ user, bootstrapping, isAuthenticated: !!user, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
