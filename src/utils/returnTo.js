// Where to go after signing in. The path travels in the address (?returnTo=/page/abc) so a deep link,
// or an invite, survives the detour through the login page. Only an in-app absolute path is accepted:
// anything that could leave the site ("//evil.com", "https://...", "/\evil.com") is ignored, so this
// cannot become an open redirect.
export const safeReturnTo = (value) => {
  if (typeof value !== 'string' || !value.startsWith('/')) return null;
  if (value.startsWith('//') || value.includes('\\')) return null;
  for (let i = 0; i < value.length; i += 1) if (value.charCodeAt(i) < 32) return null; // control characters
  if (value.startsWith('/login') || value.startsWith('/register')) return null; // never loop
  return value;
};

export const loginUrlFor = (path) => {
  const safe = safeReturnTo(path);
  return safe ? `/login?returnTo=${encodeURIComponent(safe)}` : '/login';
};

// The invite link a sign-in screen was reached from, as an in-app path (token encoded).
export const invitePath = (token) => (token ? `/invite/${encodeURIComponent(token)}` : null);
