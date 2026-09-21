import React from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

// Web: a full top-level browser navigation (not a fetch/axios call) — the
// OAuth redirect dance (this app → Google's consent screen → back to the
// API's callback → back here) needs the actual address bar to move.
//
// Native (Capacitor Android): Google blocks its consent screen from loading
// inside an embedded WebView at all ("disallowed_useragent") — this app's
// entire UI runs inside one on Android, including this button. So instead
// this launches the SYSTEM browser (Chrome Custom Tabs) via `Browser.open`,
// with `?native=1` so the backend knows to hand the session back via a deep
// link instead of a cookie (see hooks/useNativeOAuthCallback.js for the
// other half of that hand-off, and auth.controller.js#googleCallback on the
// backend for why a cookie set in the system browser can't reach the app's
// own WebView anyway).
const GOOGLE_AUTH_URL = `${import.meta.env.VITE_API_BASE_URL}/api/auth/google`;

// `inviteToken` — passed by Login.jsx/Register.jsx when the page itself was
// reached via an invite link — rides along on `?invite=` so choosing this
// button doesn't silently drop the invite (see auth.controller.js's
// googleRedirect/googleCallback for the other half of this).
const GoogleSignInButton = ({ inviteToken }) => {
  const isNative = Capacitor.isNativePlatform();
  const params = new URLSearchParams();
  if (isNative) params.set('native', '1');
  if (inviteToken) params.set('invite', inviteToken);
  const query = params.toString();
  const href = query ? `${GOOGLE_AUTH_URL}?${query}` : GOOGLE_AUTH_URL;

  const handleClick = isNative
    ? (e) => {
        e.preventDefault();
        Browser.open({ url: href });
      }
    : undefined;

  return (
    <a
      href={href}
      onClick={handleClick}
      className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-light-border bg-light-surface py-3 text-sm font-medium text-light-text transition hover:bg-light-border/40 dark:border-dark-border dark:bg-dark-raised dark:text-dark-text dark:hover:bg-dark-border/60"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.9c1.7-1.56 2.7-3.87 2.7-6.61z" />
        <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18z" />
        <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.17.27-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03l2.97-2.33z" />
        <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
      </svg>
      Continue with Google
    </a>
  );
};

export default GoogleSignInButton;
