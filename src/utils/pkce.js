// PKCE (RFC 7636, S256) for the Android Google sign-in hand-off. The backend's
// exchange code comes back through a custom-scheme deep link that any other
// installed app can also register for, so the code alone isn't enough: the
// app proves it started the sign-in by presenting the verifier whose hash it
// sent up front (see auth.service.js#exchangeNativeCode on the backend).

// localStorage rather than sessionStorage: Android can destroy and recreate
// the WebView while the system browser tab is in the foreground, which would
// wipe sessionStorage before the deep link comes back.
const VERIFIER_KEY = 'motive_pkce_verifier';

const toBase64Url = (bytes) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// 32 random bytes → 43 base64url characters, the minimum RFC 7636 length.
export const createPkcePair = async () => {
  const verifier = toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return { verifier, challenge: toBase64Url(new Uint8Array(digest)) };
};

export const saveVerifier = (verifier) => {
  try {
    localStorage.setItem(VERIFIER_KEY, verifier);
  } catch {
    // Storage unavailable — the exchange will fail closed (no verifier).
  }
};

// Single-use: reading it also clears it.
export const takeVerifier = () => {
  try {
    const verifier = localStorage.getItem(VERIFIER_KEY);
    localStorage.removeItem(VERIFIER_KEY);
    return verifier;
  } catch {
    return null;
  }
};
