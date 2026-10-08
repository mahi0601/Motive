import { describe, expect, test } from 'vitest';
import { safeReturnTo, loginUrlFor, invitePath } from './returnTo';

describe('returnTo', () => {
  test('accepts in-app paths, with query strings', () => {
    expect(safeReturnTo('/page/abc')).toBe('/page/abc');
    expect(safeReturnTo('/settings?upgrade=success')).toBe('/settings?upgrade=success');
  });
  test('refuses anything that could leave the site or loop', () => {
    for (const bad of ['//evil.com', 'https://evil.com', '/\\evil.com', 'javascript:alert(1)', '/login', '/register', '', null, undefined, '/a\nb']) {
      expect(safeReturnTo(bad)).toBeNull();
    }
  });
  test('loginUrlFor encodes the path, and falls back to plain /login', () => {
    expect(loginUrlFor('/page/a b')).toBe('/login?returnTo=%2Fpage%2Fa%20b');
    expect(loginUrlFor('//evil.com')).toBe('/login');
  });
  test('invitePath encodes the token so it cannot change the path', () => {
    expect(invitePath('abc')).toBe('/invite/abc');
    expect(invitePath('../settings')).toBe('/invite/..%2Fsettings');
    expect(invitePath(null)).toBeNull();
  });
});
