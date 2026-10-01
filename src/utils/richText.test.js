import { describe, test, expect } from 'vitest';
import { safeUrl, sanitizeInlineHtml } from './richText';

// Regression coverage for the javascript:-URL fix. Two independent sites
// used to accept an unvalidated URL straight into a live href: toggleLink's
// window.prompt() writes directly to the pre-save DOM (bypassing
// sanitizeInlineHtml entirely until the next save/reload), and Block.jsx's
// EmbedBlock renders a persisted, collaborator-visible url the same way.
// Both now run every URL through safeUrl() first.
describe('safeUrl', () => {
  test('rejects javascript: URLs', () => {
    expect(safeUrl('javascript:alert(1)')).toBeNull();
    // Case/whitespace variants a naive `startsWith` check would miss.
    expect(safeUrl('JavaScript:alert(1)')).toBeNull();
    expect(safeUrl('  javascript:alert(1)')).toBeNull();
  });

  test('rejects data: and other non-http(s) schemes', () => {
    expect(safeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(safeUrl('vbscript:msgbox(1)')).toBeNull();
    expect(safeUrl('file:///etc/passwd')).toBeNull();
  });

  test('accepts http and https URLs unchanged', () => {
    expect(safeUrl('https://example.com')).toBe('https://example.com');
    expect(safeUrl('http://example.com/path?q=1')).toBe('http://example.com/path?q=1');
  });

  test('accepts a relative URL (resolved against the current origin)', () => {
    expect(safeUrl('/pages/some-id')).toBe('/pages/some-id');
  });

  test('rejects empty input without throwing', () => {
    expect(safeUrl('')).toBeNull();
    expect(safeUrl(null)).toBeNull();
    expect(safeUrl(undefined)).toBeNull();
  });

  // A bare word with no scheme is a legitimate relative link (same as
  // "/pages/x" above) — the WHATWG URL parser resolves it against the
  // current origin rather than throwing, and that's correct: it's exactly
  // how a plain page-title-style relative link would be typed.
  test('treats a bare word as a relative link, not garbage', () => {
    expect(safeUrl('not-a-real-page')).toBe('not-a-real-page');
  });
});

// sanitizeInlineHtml already blocked javascript: hrefs on the *saved* string
// via DOMPurify's own URI allowlist — confirming that here so a future
// change to SANITIZE_CONFIG (e.g. widening ALLOWED_ATTR further) that
// accidentally reopens it gets caught.
describe('sanitizeInlineHtml', () => {
  test('strips a javascript: href even though the <a> tag itself is allowed', () => {
    const out = sanitizeInlineHtml('<a href="javascript:alert(1)">click</a>');
    expect(out).not.toContain('javascript:');
  });

  test('keeps a safe http href', () => {
    const out = sanitizeInlineHtml('<a href="https://example.com">click</a>');
    expect(out).toContain('href="https://example.com"');
  });
});
