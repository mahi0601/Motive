import { describe, test, expect, vi, afterEach } from 'vitest';
import { sanitizeInlineHtml } from './richText';

// Regression coverage for untrusted HTML reaching a LIVE-document element's
// innerHTML before DOMPurify has cleaned it. In a real browser, markup assigned
// to innerHTML of an element created by the live `document` is parsed
// immediately — `<img src=x onerror=…>` starts loading and its handler runs even
// though the element is never attached. So the invariant is not "the final
// string is clean" (it was, even when this bug existed) but "nothing untrusted is
// ever assigned to a live-document element's innerHTML at all".
//
// jsdom never loads images, so it cannot show `onerror` actually firing; the
// setter spy below is the correct gate for this bug class. A real-browser check
// lives in the e2e suite.
const PAYLOADS = {
  'bare img handler': '<img src=x onerror="alert(1)">',
  'img handler inside a bold span': '<span style="font-weight:bold"><img src=x onerror="alert(1)"></span>',
  'img handler inside an italic span': '<span style="font-style: italic"><img src=x onerror="alert(1)"></span>',
  'img handler inside nested styled spans':
    '<span style="font-weight:700"><span style="font-style:italic"><img src=x onerror="alert(1)"></span></span>',
  'svg onload inside a styled span': '<span style="font-weight:bold"><svg onload="alert(1)"></svg></span>',
  'script inside a styled span': '<span style="font-weight:bold"><script>alert(1)</script></span>',
  'iframe srcdoc inside a styled span': '<span style="font-weight:bold"><iframe srcdoc="<script>alert(1)</script>"></iframe></span>',
};

describe('sanitizeInlineHtml — XSS', () => {
  afterEach(() => vi.restoreAllMocks());

  test.each(Object.entries(PAYLOADS))('never assigns anything to a live-document innerHTML: %s', (_label, payload) => {
    const setter = vi.spyOn(Element.prototype, 'innerHTML', 'set');
    sanitizeInlineHtml(payload);
    const liveWrites = setter.mock.contexts.filter((el) => el.ownerDocument === document);
    expect(liveWrites).toHaveLength(0);
  });

  test.each(Object.entries(PAYLOADS))('the final output carries no handler, script or disallowed tag: %s', (_label, payload) => {
    const out = sanitizeInlineHtml(payload);
    expect(out).not.toMatch(/onerror|onload|srcdoc/i);
    expect(out).not.toMatch(/<(img|svg|script|iframe)/i);
  });

  test('strips event-handler attributes and disallowed tags, keeping allowed ones', () => {
    const out = sanitizeInlineHtml('<img src=x onerror="alert(1)"><script>alert(1)</script><b>ok</b>');
    expect(out).toBe('<b>ok</b>');
  });

  test('still normalizes browser-generated bold/italic spans', () => {
    expect(sanitizeInlineHtml('<span style="font-weight: bold">hi</span>')).toBe('<b>hi</b>');
    expect(sanitizeInlineHtml('<span style="font-style: italic">hi</span>')).toBe('<em>hi</em>');
    expect(sanitizeInlineHtml('<span style="font-weight:600">hi</span>')).toBe('<b>hi</b>');
  });

  test('a span that is both bold and italic becomes <b><em>…</em></b>', () => {
    expect(sanitizeInlineHtml('<span style="font-weight:bold;font-style:italic">x</span>')).toBe('<b><em>x</em></b>');
  });

  test('nested styled spans normalise to nested semantic tags', () => {
    expect(sanitizeInlineHtml('<span style="font-weight:700"><span style="font-style: italic">x</span></span>')).toBe(
      '<b><em>x</em></b>'
    );
  });

  test('keeps existing semantic marks and links inside a styled span', () => {
    const out = sanitizeInlineHtml('<span style="font-weight:bold">a <a href="https://example.com" rel="noopener noreferrer">link</a> and <code>code</code></span>');
    expect(out).toBe('<b>a <a href="https://example.com" rel="noopener noreferrer">link</a> and <code>code</code></b>');
  });

  test('a styled span with some other style is flattened to its text', () => {
    expect(sanitizeInlineHtml('<span style="color:red">hi</span>')).toBe('hi');
  });

  test('javascript: links are removed even when wrapped in a styled span', () => {
    const out = sanitizeInlineHtml('<span style="font-weight:bold"><a href="javascript:alert(1)">x</a></span>');
    expect(out).not.toMatch(/javascript:/i);
  });

  test('a stray closing tag in the input does not truncate the content that follows', () => {
    // The old implementation wrapped the input in <div>…</div>, so "</div>" in
    // user content closed the wrapper early and everything after it was lost.
    expect(sanitizeInlineHtml('a</div><b>b</b>')).toBe('a<b>b</b>');
  });

  test('returns an empty string for empty input', () => {
    expect(sanitizeInlineHtml('')).toBe('');
    expect(sanitizeInlineHtml(null)).toBe('');
    expect(sanitizeInlineHtml(undefined)).toBe('');
  });
});
