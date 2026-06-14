import React, { useEffect, useRef, useState } from 'react';
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  ChevronRight,
  Quote,
  Code,
  Minus,
  Image as ImageIcon,
  Info,
} from 'lucide-react';

export const BLOCK_OPTIONS = [
  { type: 'paragraph', label: 'Text', icon: Type, keywords: 'text paragraph' },
  { type: 'heading1', label: 'Heading 1', icon: Heading1, keywords: 'h1 title big' },
  { type: 'heading2', label: 'Heading 2', icon: Heading2, keywords: 'h2 subtitle' },
  { type: 'heading3', label: 'Heading 3', icon: Heading3, keywords: 'h3' },
  { type: 'bulleted', label: 'Bulleted list', icon: List, keywords: 'unordered bullet' },
  { type: 'numbered', label: 'Numbered list', icon: ListOrdered, keywords: 'ordered number' },
  { type: 'todo', label: 'To-do', icon: CheckSquare, keywords: 'todo checkbox task' },
  { type: 'toggle', label: 'Toggle', icon: ChevronRight, keywords: 'toggle collapse' },
  { type: 'quote', label: 'Quote', icon: Quote, keywords: 'quote blockquote' },
  { type: 'code', label: 'Code', icon: Code, keywords: 'code snippet' },
  { type: 'callout', label: 'Callout', icon: Info, keywords: 'callout note' },
  { type: 'divider', label: 'Divider', icon: Minus, keywords: 'divider line hr' },
  { type: 'image', label: 'Image', icon: ImageIcon, keywords: 'image picture photo' },
];

const SlashMenu = ({ query, position, onSelect, onClose }) => {
  const [active, setActive] = useState(0);
  const ref = useRef(null);

  const filtered = BLOCK_OPTIONS.filter((o) => {
    const q = (query || '').toLowerCase();
    return !q || o.label.toLowerCase().includes(q) || o.keywords.includes(q);
  });

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    const handler = (e) => {
      if (!filtered.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((a) => (a + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((a) => (a - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelect(filtered[active].type);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, [filtered, active, onSelect, onClose]);

  if (!filtered.length) return null;

  return (
    <div
      ref={ref}
      className="absolute z-50 w-64 max-h-72 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] shadow-xl py-1"
      style={{ top: position.top, left: position.left }}
    >
      {filtered.map((opt, i) => {
        const Icon = opt.icon;
        return (
          <button
            key={opt.type}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(opt.type);
            }}
            onMouseEnter={() => setActive(i)}
            className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${
              i === active
                ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                : 'text-gray-700 dark:text-gray-200'
            }`}
          >
            <Icon size={16} className="shrink-0" />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default SlashMenu;
