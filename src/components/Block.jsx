import React, { useEffect, useRef, useState } from 'react';
import { GripVertical, Plus, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { htmlForContent, sanitizeInlineHtml, toggleMark, toggleLink } from '../utils/richText';

// Markdown prefixes that auto-convert a block on space.
const MD_SHORTCUTS = [
  { re: /^#\s$/, type: 'heading1' },
  { re: /^##\s$/, type: 'heading2' },
  { re: /^###\s$/, type: 'heading3' },
  { re: /^[-*]\s$/, type: 'bulleted' },
  { re: /^1\.\s$/, type: 'numbered' },
  { re: /^\[\]\s$/, type: 'todo' },
  { re: /^\[\s\]\s$/, type: 'todo' },
  { re: /^>\s$/, type: 'quote' },
  { re: /^```\s$/, type: 'code' },
];

const typeClasses = {
  paragraph: 'text-base',
  heading1: 'text-3xl font-bold',
  heading2: 'text-2xl font-bold',
  heading3: 'text-xl font-semibold',
  bulleted: 'text-base',
  numbered: 'text-base',
  todo: 'text-base',
  toggle: 'text-base',
  quote: 'text-base italic',
  code: 'font-mono text-sm',
  callout: 'text-base',
};

const placeholderFor = (type) =>
  ({
    heading1: 'Heading 1',
    heading2: 'Heading 2',
    heading3: 'Heading 3',
    todo: 'To-do',
    bulleted: 'List item',
    numbered: 'List item',
    quote: 'Quote',
    code: 'Code',
    callout: 'Callout',
  }[type] || "Type '/' for commands");

// content: { rows: string[][] }
const TableBlock = ({ content, onChange }) => {
  const rows = content?.rows?.length ? content.rows : [['', '']];

  const setCell = (r, c, value) => {
    const next = rows.map((row) => [...row]);
    next[r][c] = value;
    onChange({ rows: next });
  };

  const addRow = () => onChange({ rows: [...rows, rows[0].map(() => '')] });
  const addColumn = () => onChange({ rows: rows.map((row) => [...row, '']) });

  return (
    <div className="w-full">
      <table className="w-full border-collapse text-sm">
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td key={c} className="border border-gray-300 p-0 dark:border-gray-600">
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => setCell(r, c, e.currentTarget.textContent)}
                    className="min-w-[80px] px-2 py-1.5 outline-none focus:bg-brand-soft"
                  >
                    {cell}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-1 flex gap-3 text-xs text-gray-400">
        <button onClick={addRow} className="hover:text-brand-500">+ Row</button>
        <button onClick={addColumn} className="hover:text-brand-500">+ Column</button>
      </div>
    </div>
  );
};

// content: { url: string }
const YOUTUBE_RE = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/;
const EmbedBlock = ({ content, onChange }) => {
  const [draft, setDraft] = useState(content?.url || '');
  const url = content?.url;

  if (!url) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.trim()) onChange({ url: draft.trim() });
        }}
        className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 p-3 dark:border-gray-600"
      >
        <LinkIcon size={16} className="shrink-0 text-gray-400" />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Paste a link (YouTube, or any URL)…"
          className="flex-1 border-none bg-transparent text-sm outline-none"
        />
        <button type="submit" className="text-xs font-semibold text-brand-500 hover:text-brand-600">
          Embed
        </button>
      </form>
    );
  }

  const ytMatch = url.match(YOUTUBE_RE);
  if (ytMatch) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg">
        <iframe
          src={`https://www.youtube.com/embed/${ytMatch[1]}`}
          title="Embedded video"
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 text-sm text-brand-600 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5"
    >
      <ExternalLink size={16} className="shrink-0" />
      <span className="truncate">{url}</span>
    </a>
  );
};

const caretAtStart = (el) => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;
  const range = sel.getRangeAt(0);
  const pre = range.cloneRange();
  pre.selectNodeContents(el);
  pre.setEnd(range.startContainer, range.startOffset);
  return pre.toString().length === 0;
};

const Block = ({
  block,
  index,
  shouldFocus,
  onChange,
  onEnter,
  onDeleteEmpty,
  onConvert,
  onSlash,
  onToggleCheck,
  onAddBelow,
}) => {
  const ref = useRef(null);
  const [toolbar, setToolbar] = useState(null); // { top, left } or null

  // Show a floating format toolbar when the user selects text within this
  // block. Two things rule out the more obvious approaches: keyboard
  // shortcuts (Cmd+B etc.) are unreliable — macOS Chrome/Safari intercept
  // them as a native OS-level Edit-menu command before any DOM keydown event
  // fires at all — and onMouseUp doesn't work either, because the drag-handle
  // wrapper each block sits in (BlockEditor.jsx's <Draggable>) stops
  // propagation of its own mouseup handling before it bubbles to React's
  // synthetic listener here. `selectionchange` is the actual standard event
  // for "the selection changed" and fires regardless of what triggered it or
  // how any wrapper's event handlers behave.
  useEffect(() => {
    const onSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0 || !ref.current?.contains(sel.anchorNode)) {
        setToolbar(null);
        return;
      }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      const parentRect = ref.current.offsetParent?.getBoundingClientRect() || { top: 0, left: 0 };
      setToolbar({ top: rect.top - parentRect.top - 36, left: rect.left - parentRect.left });
    };
    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, []);

  // Uncontrolled: seed content once on mount / when block identity changes.
  // `content.html` carries inline marks (bold/italic/code); legacy blocks
  // only have `content.text` (plain string), escaped into safe HTML here.
  useEffect(() => {
    const html = htmlForContent(block.content);
    if (ref.current && ref.current.innerHTML !== html) {
      ref.current.innerHTML = html;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.id, block.type]);

  useEffect(() => {
    if (shouldFocus && ref.current) {
      ref.current.focus();
      // place caret at end
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, [shouldFocus]);

  const handleInput = (e) => {
    // Markdown-shortcut/slash detection stays plain-text — unaffected by
    // whatever inline marks are present.
    const text = e.currentTarget.textContent;

    // markdown auto-conversion
    for (const { re, type } of MD_SHORTCUTS) {
      if (re.test(text)) {
        e.currentTarget.textContent = '';
        onConvert(block.id, type);
        return;
      }
    }

    // slash command
    if (text === '/') {
      const rect = e.currentTarget.getBoundingClientRect();
      const parentRect = e.currentTarget.offsetParent?.getBoundingClientRect() || { top: 0, left: 0 };
      onSlash(block.id, {
        top: rect.bottom - parentRect.top + 4,
        left: rect.left - parentRect.left,
      });
    }

    // `text` is kept in sync as a plain-text mirror — the backend's page
    // search filters on content.text (JSON path), so it needs to stay a
    // plain string even though `html` now carries the real formatted markup.
    const html = sanitizeInlineHtml(e.currentTarget.innerHTML);
    onChange(block.id, { ...block.content, html, text });
  };

  const handleFormatKeydown = (e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return false;
    const tag = { b: 'B', i: 'EM', e: 'CODE' }[e.key.toLowerCase()];
    if (!tag) return false;
    e.preventDefault();
    toggleMark(ref.current, tag);
    // toggleMark mutates the DOM directly — sync content back into state
    // the same way a normal keystroke would.
    handleInput({ currentTarget: ref.current });
    return true;
  };

  const handleKeyDown = (e) => {
    if (handleFormatKeydown(e)) return;
    if (e.key === 'Enter' && !e.shiftKey && block.type !== 'code') {
      e.preventDefault();
      onEnter(block.id, index);
    } else if (e.key === 'Backspace') {
      const text = e.currentTarget.textContent;
      if (text.length === 0 || caretAtStart(e.currentTarget)) {
        if (text.length === 0) {
          e.preventDefault();
          onDeleteEmpty(block.id, index);
        }
      }
    }
  };

  if (block.type === 'divider') {
    return (
      <div className="group relative flex items-center py-2">
        <hr className="w-full border-gray-300 dark:border-gray-600" />
      </div>
    );
  }

  if (block.type === 'table') {
    return (
      <div className="group relative py-1">
        <TableBlock content={block.content} onChange={(content) => onChange(block.id, content)} />
      </div>
    );
  }

  if (block.type === 'embed') {
    return (
      <div className="group relative py-1">
        <EmbedBlock content={block.content} onChange={(content) => onChange(block.id, content)} />
      </div>
    );
  }

  const editable = (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholderFor(block.type)}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onBlur={() => setToolbar(null)}
      className={`flex-1 outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 dark:empty:before:text-gray-500 [&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] dark:[&_code]:bg-gray-700 [&_a]:text-brand-500 [&_a]:underline [&_mark]:rounded-sm [&_mark]:bg-yellow-200 [&_mark]:px-0.5 dark:[&_mark]:bg-yellow-300 dark:[&_mark]:text-black ${
        typeClasses[block.type] || 'text-base'
      } ${block.content?.checked ? 'line-through text-gray-400' : ''}`}
    />
  );

  const applyMark = (tag) => {
    toggleMark(ref.current, tag);
    handleInput({ currentTarget: ref.current });
  };

  const applyLink = () => {
    toggleLink(ref.current);
    handleInput({ currentTarget: ref.current });
  };

  const FormatToolbar = toolbar && (
    <div
      className="absolute z-10 flex gap-0.5 rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-[#1f1f1f]"
      style={{ top: toolbar.top, left: toolbar.left }}
    >
      {[
        { tag: 'B', label: 'B', title: 'Bold', cls: 'font-bold' },
        { tag: 'EM', label: 'I', title: 'Italic', cls: 'italic' },
        { tag: 'CODE', label: '</>', title: 'Code', cls: 'font-mono text-xs' },
        { tag: 'MARK', label: 'H', title: 'Highlight', cls: 'rounded-sm bg-yellow-200 px-0.5 dark:bg-yellow-300 dark:text-black' },
      ].map((b) => (
        <button
          key={b.tag}
          title={b.title}
          onMouseDown={(e) => {
            e.preventDefault(); // keep the selection alive through the click
            applyMark(b.tag);
          }}
          className={`h-7 w-7 rounded text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10 ${b.cls}`}
        >
          {b.label}
        </button>
      ))}
      <button
        title="Link"
        onMouseDown={(e) => {
          e.preventDefault();
          applyLink();
        }}
        className="h-7 w-7 rounded text-sm text-gray-700 underline hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
      >
        🔗
      </button>
    </div>
  );

  return (
    <div className="group relative flex items-start gap-1 rounded px-1 py-0.5 hover:bg-gray-50 dark:hover:bg-white/5">
      {FormatToolbar}
      {/* hover controls */}
      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity pt-1">
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            onAddBelow(index);
          }}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          title="Add block below"
        >
          <Plus size={16} />
        </button>
        <span className="cursor-grab text-gray-400" title="Drag to reorder">
          <GripVertical size={16} />
        </span>
      </div>

      {/* type-specific prefix */}
      {block.type === 'bulleted' && <span className="pt-1 select-none">•</span>}
      {block.type === 'numbered' && <span className="pt-1 select-none">{(index ?? 0) + 1}.</span>}
      {block.type === 'todo' && (
        <input
          type="checkbox"
          checked={!!block.content?.checked}
          onChange={() => onToggleCheck(block.id, !block.content?.checked)}
          className="mt-1.5 h-4 w-4 accent-indigo-500"
        />
      )}
      {block.type === 'quote' && <span className="self-stretch w-1 rounded bg-gray-300 dark:bg-gray-600" />}
      {block.type === 'callout' && <span className="pt-0.5 select-none">💡</span>}

      {block.type === 'code' ? (
        <div className="flex-1 rounded bg-gray-100 dark:bg-[#161616] p-3">{editable}</div>
      ) : (
        editable
      )}
    </div>
  );
};

export default Block;
