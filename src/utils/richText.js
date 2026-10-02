import DOMPurify from 'dompurify';

// Strict allowlist — only the inline marks Block.jsx actually supports.
// Everything else (scripts, styles, event handlers, arbitrary tags from a
// paste) is stripped.
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'code', 'br', 'a', 'mark'],
  // `rel`/`target` alongside `href` — toggleLink() below now sets
  // rel="noopener noreferrer" on every link it creates; without these in
  // the allowlist, DOMPurify would strip that attribute back out on the
  // very next save/reload round-trip.
  ALLOWED_ATTR: ['href', 'rel', 'target'],
};

// macOS Chrome/Safari intercept Cmd+B/Cmd+I as a native OS-level text-editing
// shortcut for ANY editable control — it never reaches page JS as a keydown
// event at all, so our own handler (toggleMark, below) can't prevent it. The
// browser applies its own `<span style="font-weight:...">`/`font-style:...`
// styling directly. Since the sanitizer's tag allowlist doesn't include
// <span>, that would otherwise silently vanish on save — so normalize it
// into semantic tags first, whichever code path produced it.
//
// SAFETY INVARIANT: untrusted markup must never be assigned to the innerHTML of
// an element that belongs to the LIVE document. A browser parses that string
// immediately, so `<img src=x onerror=…>` starts loading and its handler runs
// even though the element is never attached to the page — i.e. before DOMPurify
// has seen it. Everything below therefore happens inside one inert document
// (DOMParser never runs scripts or loads resources), and the semantic wrappers
// are built with createElement in that same document with the existing nodes
// MOVED into them — there is no string round-trip anywhere.
const normalizeStyledSpans = (html) => {
  // Parsed into the body directly rather than wrapped in a <div>: wrapping let a
  // stray "</div>" in user content close the wrapper early and silently drop
  // everything after it.
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.body.querySelectorAll('span[style]').forEach((span) => {
    const style = span.getAttribute('style') || '';
    const bold = /font-weight:\s*(bold|[6-9]00)/i.test(style);
    const italic = /font-style:\s*italic/i.test(style);
    if (!bold && !italic) return; // some other inline style — leave for the allowlist to strip

    // Bold outermost, italic inside it: <b><em>…</em></b>.
    const tags = [];
    if (bold) tags.push('b');
    if (italic) tags.push('em');
    const fragment = doc.createDocumentFragment();
    let parent = fragment;
    tags.forEach((tag) => {
      const el = doc.createElement(tag);
      parent.append(el);
      parent = el;
    });
    parent.append(...span.childNodes);
    span.replaceWith(fragment);
  });
  return doc.body.innerHTML;
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

// Inserts pasted content at the caret (replacing any selection) inside `root`,
// the contentEditable node. Clipboard HTML from Word, Google Docs or a web page
// carries styles, spans, scripts and handlers; the editor keeps only its own
// inline marks, so the HTML is cleaned first (sanitizeInlineHtml) and then turned
// into nodes in an inert document and imported: untrusted markup is never parsed
// into the live document. With no (usable) HTML, plain text is inserted as text
// nodes, newlines becoming <br>. Returns true if something was inserted.
export const insertPastedContent = (root, { html, text } = {}) => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;
  const range = sel.getRangeAt(0);
  if (!root.contains(range.commonAncestorContainer)) return false;

  const fragment = document.createDocumentFragment();
  const cleaned = html ? sanitizeInlineHtml(html) : '';
  if (cleaned.trim()) {
    const inert = new DOMParser().parseFromString(cleaned, 'text/html');
    inert.body.childNodes.forEach((node) => fragment.appendChild(document.importNode(node, true)));
  } else if (text) {
    text.replace(/\r\n?/g, '\n').split('\n').forEach((line, i) => {
      if (i > 0) fragment.appendChild(document.createElement('br'));
      if (line) fragment.appendChild(document.createTextNode(line));
    });
  } else {
    return false;
  }

  range.deleteContents();
  range.insertNode(fragment);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
  return true;
};

// Allowlists http(s) — a `javascript:`/`data:` URL written straight into an
// `href` runs the instant it's clicked. DOMPurify's own URI scheme allowlist
// already blocks those on the *saved* string (sanitizeInlineHtml, above),
// but toggleLink() below writes directly to the live, pre-save DOM node —
// and Block.jsx never re-syncs that node's innerHTML from state after the
// initial mount, so an unsafe href written here would stay live and
// clickable for the rest of the editing session regardless of what
// DOMPurify would have done to it on save. EmbedBlock (Block.jsx) uses this
// too, for a *persisted* URL — visible to every collaborator, not just
// whoever typed it.
export const safeUrl = (url) => {
  if (!url) return null;
  try {
    // Base only matters for a relative URL (e.g. "/pages/x") — resolves it
    // against the current origin rather than rejecting it outright.
    const parsed = new URL(url, window.location.origin);
    return ['http:', 'https:'].includes(parsed.protocol) ? url : null;
  } catch {
    return null;
  }
};

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

// Links need a URL (via prompt), not just a bare wrap/unwrap, so this is
// separate from toggleMark rather than a generic case of it.
export const toggleLink = (root) => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
  const range = sel.getRangeAt(0);

  let node = range.commonAncestorContainer;
  while (node && node !== root) {
    if (node.nodeType === 1 && node.tagName === 'A') {
      const parent = node.parentNode;
      while (node.firstChild) parent.insertBefore(node.firstChild, node);
      parent.removeChild(node);
      return;
    }
    node = node.parentNode;
  }

  const url = window.prompt('Link URL:', 'https://');
  if (!url || !url.trim()) return;
  const safe = safeUrl(url.trim());
  if (!safe) {
    window.alert('Only http:// and https:// links are allowed.');
    return;
  }

  const a = document.createElement('a');
  a.href = safe;
  a.rel = 'noopener noreferrer';
  a.appendChild(range.extractContents());
  range.insertNode(a);
  sel.removeAllRanges();
  const after = document.createRange();
  after.selectNodeContents(a);
  after.collapse(false);
  sel.addRange(after);
};
