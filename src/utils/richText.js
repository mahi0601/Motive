import DOMPurify from 'dompurify';

// Strict allowlist — only the inline marks Block.jsx actually supports.
// Everything else (scripts, styles, event handlers, arbitrary tags from a
// paste) is stripped.
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'code', 'br'],
  ALLOWED_ATTR: [],
};

// macOS Chrome/Safari intercept Cmd+B/Cmd+I as a native OS-level text-editing
// shortcut for ANY editable control — it never reaches page JS as a keydown
// event at all, so our own handler (toggleMark, below) can't prevent it. The
// browser applies its own `<span style="font-weight:...">`/`font-style:...`
// styling directly. Since the sanitizer's tag allowlist doesn't include
// <span>, that would otherwise silently vanish on save — so normalize it
// into semantic tags first, whichever code path produced it.
const normalizeStyledSpans = (html) => {
  const container = document.createElement('div');
  container.innerHTML = html;
  container.querySelectorAll('span[style]').forEach((span) => {
    const style = span.getAttribute('style') || '';
    const bold = /font-weight:\s*(bold|[6-9]00)/i.test(style);
    const italic = /font-style:\s*italic/i.test(style);
    if (!bold && !italic) return; // some other inline style — leave for the allowlist to strip
    let inner = span.innerHTML;
    if (italic) inner = `<em>${inner}</em>`;
    if (bold) inner = `<b>${inner}</b>`;
    const wrapper = document.createElement('span');
    wrapper.innerHTML = inner;
    span.replaceWith(...wrapper.childNodes);
  });
  return container.innerHTML;
};

export const sanitizeInlineHtml = (html) => DOMPurify.sanitize(normalizeStyledSpans(html || ''), SANITIZE_CONFIG);

// Legacy blocks only ever had `content.text` (plain string). Escape it so it
// round-trips safely into the now-HTML-based editable surface.
const escapeHtml = (text) =>
  (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export const htmlForContent = (content) =>
  content?.html != null ? sanitizeInlineHtml(content.html) : escapeHtml(content?.text);

// Toggle an inline mark (<b>, <em>, <code>) on the current selection within
// `root`. document.execCommand('bold'/'italic') turned out to be unreliable
// across browsers — it can emit <span style="font-weight:..."> instead of a
// semantic tag, which the sanitizer's tag allowlist (by design) then strips,
// silently dropping the formatting. Doing this by hand is more code but
// deterministic and matches how the (already-required, execCommand has no
// equivalent) inline-code toggle works.
export const toggleMark = (root, tagName) => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
  const range = sel.getRangeAt(0);

  let node = range.commonAncestorContainer;
  while (node && node !== root) {
    if (node.nodeType === 1 && node.tagName === tagName) {
      // Already wrapped — unwrap it.
      const parent = node.parentNode;
      while (node.firstChild) parent.insertBefore(node.firstChild, node);
      parent.removeChild(node);
      return;
    }
    node = node.parentNode;
  }

  const wrapper = document.createElement(tagName.toLowerCase());
  wrapper.appendChild(range.extractContents());
  range.insertNode(wrapper);
  sel.removeAllRanges();
  const after = document.createRange();
  after.selectNodeContents(wrapper);
  after.collapse(false);
  sel.addRange(after);
};
