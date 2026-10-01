import { describe, test, expect, beforeEach } from 'vitest';
import { createPkcePair, saveVerifier, takeVerifier } from './pkce';

// Independent SHA-256 → base64url so the test doesn't just re-run the code
// under test.
const sha256Base64Url = async (text) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

describe('createPkcePair', () => {
  test('verifier is 43+ base64url characters and the challenge is its S256 hash', async () => {
    const { verifier, challenge } = await createPkcePair();
    expect(verifier).toMatch(/^[A-Za-z0-9_-]{43,128}$/);
    expect(challenge).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(challenge).toBe(await sha256Base64Url(verifier));
  });

  test('every pair is different', async () => {
    const a = await createPkcePair();
    const b = await createPkcePair();
    expect(a.verifier).not.toBe(b.verifier);
  });
});

describe('verifier storage', () => {
  beforeEach(() => localStorage.clear());

  test('takeVerifier returns the saved value once, then null', () => {
    saveVerifier('abc');
    expect(takeVerifier()).toBe('abc');
    expect(takeVerifier()).toBeNull();
  });

  test('takeVerifier is null when nothing was saved', () => {
    expect(takeVerifier()).toBeNull();
  });
});
