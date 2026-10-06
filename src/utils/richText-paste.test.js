import { describe, test, expect, vi, afterEach, beforeEach } from 'vitest';
import { insertPastedContent } from './richText';

// Pasting from Word, Google Docs or a web page brings along styles, spans,
// scripts and event handlers. The editor keeps only its own inline marks
// (bold, italic, code, links, highlight), and untrusted markup is never parsed
// into the live document before it has been cleaned.
const editor = (html = '') => {
  const el = document.createElement('div');
  el.contentEditable = 'true';
  el.innerHTML = html; // test fixture only
  document.body.appendChild(el);
  return el;
};
const selectAll = (el) => {
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
};
const caretAtEnd = (el) => {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
};

describe('insertPastedContent', () => {
  let el;
  beforeEach(() => {
    el = editor('hello');
  });
  afterEach(() => {
    el.remove();
    vi.restoreAllMocks();
  });

  test('keeps the allowed marks and drops everything else', () => {
    caretAtEnd(el);
    insertPastedContent(el, {
      html: '<meta charset="utf-8"><b>bold</b> <span style="color:red;font-size:40px">plain</span> <script>window.__x=1</script><img src=x onerror="window.__y=1"><a href="https://example.com" onclick="evil()">link</a>',
    });
    expect(el.innerHTML).toBe('hello<b>bold</b> plain <a href="https://example.com" rel="noopener noreferrer">link</a>');
    expect(window.__x).toBeUndefined();
    expect(window.__y).toBeUndefined();
  });

  test('replaces the current selection', () => {
    selectAll(el);
    insertPastedContent(el, { html: '<em>new</em>' });
    expect(el.innerHTML).toBe('<em>new</em>');
  });

  test('javascript: links do not survive', () => {
    caretAtEnd(el);
    insertPastedContent(el, { html: '<a href="javascript:alert(1)">x</a>' });
    expect(el.innerHTML).not.toMatch(/javascript:/i);
  });

  test('plain text is inserted as text (markup characters stay literal), newlines become line breaks', () => {
    caretAtEnd(el);
    insertPastedContent(el, { text: 'a <b>not bold</b>\nsecond line' });
    expect(el.querySelector('b')).toBeNull();
    expect(el.textContent).toBe('helloa <b>not bold</b>second line');
    expect(el.querySelectorAll('br')).toHaveLength(1);
  });

  test('prefers the HTML flavour when both are present, and falls back to text when the HTML is empty after cleaning', () => {
    caretAtEnd(el);
    insertPastedContent(el, { html: '<b>rich</b>', text: 'rich' });
    expect(el.innerHTML).toBe('hello<b>rich</b>');
    el.innerHTML = 'x';
    caretAtEnd(el);
    insertPastedContent(el, { html: '<script>1</script>', text: 'fallback text' });
    expect(el.textContent).toBe('xfallback text');
  });

  test('puts the caret after the pasted content so typing continues there', () => {
    caretAtEnd(el);
    insertPastedContent(el, { html: '<b>x</b>' });
    const sel = window.getSelection();
    expect(sel.isCollapsed).toBe(true);
    expect(el.contains(sel.anchorNode)).toBe(true);
    expect(sel.getRangeAt(0).startContainer === el && sel.getRangeAt(0).startOffset === el.childNodes.length).toBe(true);
  });

  test('never assigns untrusted markup to the live document\'s innerHTML', () => {
    const setter = vi.spyOn(Element.prototype, 'innerHTML', 'set');
    caretAtEnd(el);
    insertPastedContent(el, { html: '<img src=x onerror="alert(1)"><b>ok</b>' });
    expect(setter.mock.contexts.filter((n) => n.ownerDocument === document)).toHaveLength(0);
  });

  test('does nothing, without throwing, when there is no selection inside the editor', () => {
    window.getSelection().removeAllRanges();
    expect(() => insertPastedContent(el, { html: '<b>x</b>' })).not.toThrow();
    expect(el.innerHTML).toBe('hello');
  });

  test('ignores a selection that lives outside the editor', () => {
    const other = editor('elsewhere');
    selectAll(other);
    insertPastedContent(el, { html: '<b>x</b>' });
    expect(el.innerHTML).toBe('hello');
    expect(other.innerHTML).toBe('elsewhere');
    other.remove();
  });
});
