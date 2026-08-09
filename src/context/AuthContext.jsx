import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setAccessToken, clearAccessToken, refreshSession } from '../services/api';
import { logout as logoutRequest } from '../services/authService';
import { getProfile } from '../services/userService';

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
      try {
        const { user: restored } = await refreshSession();
        if (active) setUser(restored);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setBootstrapping(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Called by Login/Register after a successful response.
  const login = useCallback((userData, accessToken) => {
    setAccessToken(accessToken);
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
