import React, { useEffect, useRef } from 'react';
import { GripVertical, Plus } from 'lucide-react';

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

  // Uncontrolled: seed text once on mount / when block identity changes.
  useEffect(() => {
    if (ref.current && ref.current.textContent !== (block.content?.text || '')) {
      ref.current.textContent = block.content?.text || '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block._id, block.type]);

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
    const text = e.currentTarget.textContent;

    // markdown auto-conversion
    for (const { re, type } of MD_SHORTCUTS) {
      if (re.test(text)) {
        e.currentTarget.textContent = '';
        onConvert(block._id, type);
        return;
      }
    }

    // slash command
    if (text === '/') {
      const rect = e.currentTarget.getBoundingClientRect();
      const parentRect = e.currentTarget.offsetParent?.getBoundingClientRect() || { top: 0, left: 0 };
      onSlash(block._id, {
        top: rect.bottom - parentRect.top + 4,
        left: rect.left - parentRect.left,
      });
    }

    onChange(block._id, { ...block.content, text });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && block.type !== 'code') {
      e.preventDefault();
      onEnter(block._id, index);
    } else if (e.key === 'Backspace') {
      const text = e.currentTarget.textContent;
      if (text.length === 0 || caretAtStart(e.currentTarget)) {
        if (text.length === 0) {
          e.preventDefault();
          onDeleteEmpty(block._id, index);
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

  const editable = (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholderFor(block.type)}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      className={`flex-1 outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 dark:empty:before:text-gray-500 ${
        typeClasses[block.type] || 'text-base'
      } ${block.content?.checked ? 'line-through text-gray-400' : ''}`}
    />
  );

  return (
    <div className="group relative flex items-start gap-1 rounded px-1 py-0.5 hover:bg-gray-50 dark:hover:bg-white/5">
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
          onChange={() => onToggleCheck(block._id, !block.content?.checked)}
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
