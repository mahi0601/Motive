import { describe, test, expect, vi, afterEach } from 'vitest';
import { sanitizeInlineHtml } from './richText';

// Regression coverage for the sanitizer running untrusted HTML through a
// live-document element's innerHTML before DOMPurify. The normalization step
// now parses with DOMParser (an inert document), so nothing in the input is
// ever attached to the live document before it is sanitized.
describe('sanitizeInlineHtml — XSS', () => {
  afterEach(() => vi.restoreAllMocks());

  test('strips event-handler attributes and disallowed tags', () => {
    const out = sanitizeInlineHtml('<img src=x onerror="alert(1)"><script>alert(1)</script><b>ok</b>');
    expect(out).not.toMatch(/onerror/i);
    expect(out).not.toMatch(/<script/i);
    expect(out).not.toMatch(/<img/i);
    expect(out).toContain('<b>ok</b>');
  });

  test('does not assign untrusted HTML to a live element via innerHTML', () => {
    const setter = vi.spyOn(Element.prototype, 'innerHTML', 'set');
    sanitizeInlineHtml('<img src=x onerror="alert(1)">');
    const sawPayload = setter.mock.calls.some(([html]) => /onerror/i.test(String(html)));
    expect(sawPayload).toBe(false);
  });

  test('still normalizes browser-generated bold/italic spans', () => {
    const out = sanitizeInlineHtml('<span style="font-weight: bold">hi</span>');
    expect(out).toContain('<b>hi</b>');
  });

  test('returns an empty string for empty input', () => {
    expect(sanitizeInlineHtml('')).toBe('');
    expect(sanitizeInlineHtml(null)).toBe('');
  });
});
