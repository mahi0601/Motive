import { describe, test, expect } from 'vitest';
import { scrubUrl, scrubEvent, scrubBreadcrumb } from './sentryScrub';

const T = 'SECRETTOKEN0123456789';

describe('scrubUrl', () => {
  test.each([
    [`https://app.test/invite/${T}`, 'https://app.test/invite/[redacted]'],
    [`https://app.test/s/${T}`, 'https://app.test/s/[redacted]'],
    [`/api/status/${T}`, '/api/status/[redacted]'],
    [`/api/invites/${T}/accept`, '/api/invites/[redacted]/accept'],
    [`/api/payments/session/cs_test_${T}`, '/api/payments/session/[redacted]'],
    [`https://app.test/reset-password?token=${T}`, 'https://app.test/reset-password?token=%5Bredacted%5D'],
    [`https://app.test/dashboard?csrf=${T}&highlight=abc`, 'https://app.test/dashboard?csrf=%5Bredacted%5D&highlight=abc'],
    [`https://app.test/settings?upgrade=success&session_id=cs_${T}`, 'https://app.test/settings?upgrade=success&session_id=%5Bredacted%5D'],
    [`/cb?code=${T}&state=${T}&invite=${T}`, '/cb?code=%5Bredacted%5D&state=%5Bredacted%5D&invite=%5Bredacted%5D'],
    ['https://app.test/dashboard', 'https://app.test/dashboard'],
  ])('%s', (input, expected) => expect(scrubUrl(input)).toBe(expected));

  test('tolerates non-strings', () => {
    expect(scrubUrl(undefined)).toBeUndefined();
    expect(scrubUrl(null)).toBeNull();
  });
});

describe('scrubEvent / scrubBreadcrumb', () => {
  test('removes tokens from every URL-bearing field of an event', () => {
    const event = {
      request: { url: `https://app.test/invite/${T}`, query_string: `token=${T}`, headers: { Referer: `https://app.test/s/${T}` }, cookies: { a: 'b' } },
      transaction: `/invite/${T}`,
      breadcrumbs: [{ category: 'navigation', data: { from: `/s/${T}`, to: '/dashboard' } }, { category: 'fetch', data: { url: `/api/invites/${T}` } }],
    };
    const out = JSON.stringify(scrubEvent(event));
    expect(out).not.toContain(T);
    expect(out).toContain('/dashboard');
  });

  test('scrubBreadcrumb handles xhr/fetch/navigation shapes and missing data', () => {
    expect(JSON.stringify(scrubBreadcrumb({ category: 'xhr', data: { url: `/api/status/${T}` } }))).not.toContain(T);
    expect(scrubBreadcrumb({ category: 'console', message: 'hi' })).toEqual({ category: 'console', message: 'hi' });
  });
});
