import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { nativeExchange } from '../services/authService';
import { useToast } from '../context/ToastContext';

// Catches the deep link the backend redirects to once Google sign-in
// completes in the system browser: com.motive.app://oauth-callback?code=...
// (see auth.controller.js#googleCallback and GoogleSignInButton.jsx for the
// rest of this hand-off). Only relevant on native Android — the web flow
// never fires appUrlOpen. Mount this once, app-wide (see App.jsx).
export const useNativeOAuthCallback = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { notify } = useToast();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;

    const sub = App.addListener('appUrlOpen', async ({ url }) => {
      if (!url?.startsWith('com.motive.app://oauth-callback')) return;

      // Close the system browser tab now that we're back in the app.
      Browser.close().catch(() => {});

      const { searchParams } = new URL(url);
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error || !code) {
        notify('error', 'Google sign-in failed', 'Please try again.');
        navigate('/login');
        return;
      }

      try {
        const { data } = await nativeExchange(code);
        login(data.user, data.accessToken);
        navigate('/dashboard');
      } catch {
        notify('error', 'Google sign-in failed', 'Please try again.');
        navigate('/login');
      }
    });

    return () => {
      sub.then((s) => s.remove());
    };
  }, [login, navigate, notify]);
};
