import { describe, test, expect, vi, beforeEach } from 'vitest';

// The cookie-bearing auth calls must (a) send credentials, or the browser drops
// Set-Cookie on a cross-origin response and a reload can never restore the
// session, and (b) for refresh/logout, send the custom header the backend uses
// in place of the old in-memory CSRF nonce.
const calls = [];
vi.mock('axios', () => {
  const make = () => {
    const client = {
      post: vi.fn((url, body, config) => {
        calls.push({ url, body, config });
        return Promise.resolve({ data: { accessToken: 'tok', user: { id: 'u' } } });
      }),
      get: vi.fn(),
      interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
    };
    return client;
  };
  return { default: { create: vi.fn(make) } };
});

describe('session calls', () => {
  beforeEach(() => {
    calls.length = 0;
    vi.resetModules();
  });

  test('login, register and native-exchange send credentials so the refresh cookie is stored', async () => {
    const auth = await import('./authService');
    await auth.login({ email: 'a@b.c', password: 'x' });
    await auth.register({ name: 'n', email: 'a@b.c', password: 'x' });
    await auth.nativeExchange('code', 'verifier');
    expect(calls.map((c) => c.url)).toEqual(['/api/auth/login', '/api/auth/register', '/api/auth/native-exchange']);
    calls.forEach((c) => expect(c.config.withCredentials).toBe(true));
  });

  test('logout sends credentials and the X-Requested-With header — and no CSRF nonce', async () => {
    const auth = await import('./authService');
    await auth.logout();
    expect(calls[0].config.withCredentials).toBe(true);
    expect(calls[0].config.headers).toEqual({ 'X-Requested-With': 'motive' });
  });

  test('refreshSession sends the header, and keeps only the access token', async () => {
    const api = await import('./api');
    const data = await api.refreshSession();
    expect(calls[0].url).toBe('/api/auth/refresh');
    expect(calls[0].config.headers).toEqual({ 'X-Requested-With': 'motive' });
    expect(api.getAccessToken()).toBe('tok');
    expect(data.csrfToken).toBeUndefined();
  });
});
