import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, FileText, PlusCircle, Search } from 'lucide-react';
import { useCommandPalette } from '../../context/CommandPaletteContext';
import { searchPages } from '../../services/pageService';
import { searchTasks } from '../../services/taskService';
import { useWorkspace } from '../../context/WorkspaceContext';
import { PRIMARY_NAV, SECONDARY_NAV } from '../../config/nav';

// Derived from the same nav config the Sidebar reads, so a rename there
// (see config/nav.js) can never drift out of sync with what the palette
// offers — this used to hardcode its own copy ("Go to Statistics" vs. the
// sidebar's "Statistics" vs. the button's "Analytics", all for one page).
const QUICK_ACTIONS = [
  ...[...PRIMARY_NAV, ...SECONDARY_NAV].map((item) => ({
    id: `nav-${item.id}`,
    label: `Go to ${item.label}`,
    icon: item.Icon,
    path: item.path,
  })),
  { id: 'new-task', label: 'New task', icon: PlusCircle, path: '/dashboard?new=task' },
  { id: 'new-page', label: 'New page', icon: FileText, path: null }, // handled specially in choose()
];

const CommandPalette = () => {
  const { isOpen, close } = useCommandPalette();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [taskResults, setTaskResults] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { addPage } = useWorkspace();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setTaskResults([]);
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Debounced live page + task search — reuses the existing search endpoints.
  useEffect(() => {
    if (!isOpen || !query.trim()) {
      setResults([]);
      setTaskResults([]);
      return;
    }
    let active = true;
    const t = setTimeout(async () => {
      const q = query.trim();
      try {
        const { data } = await searchPages(q);
        if (active) setResults(data.pages || []);
      } catch {
        if (active) setResults([]);
      }
      try {
        const { data } = await searchTasks(q);
        if (active) setTaskResults(data.tasks || []);
      } catch {
        if (active) setTaskResults([]);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query, isOpen]);

  const filteredActions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return QUICK_ACTIONS;
    return QUICK_ACTIONS.filter((a) => a.label.toLowerCase().includes(q));
  }, [query]);

  // Actions first, then live page/task-search results — one flat list for arrow-key nav.
  const items = useMemo(
    () => [
      ...filteredActions.map((a) => ({ kind: 'action', ...a })),
      ...taskResults.map((t) => ({ kind: 'task', id: t.id, label: t.title, icon: CheckSquare })),
      ...results.map((p) => ({ kind: 'page', id: p.id, label: p.title || 'Untitled', icon: FileText })),
    ],
    [filteredActions, results, taskResults]
  );

  const choose = async (item) => {
    if (!item) return;
    close();
    if (item.kind === 'page') {
      navigate(`/page/${item.id}`);
      return;
    }
    if (item.kind === 'task') {
      navigate(`/dashboard?edit=${item.id}`);
      return;
    }
    if (item.id === 'new-page') {
      const page = await addPage({ title: 'Untitled' });
      if (page?.id) navigate(`/page/${page.id}`);
      return;
    }
    navigate(item.path);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(items[activeIndex]);
    } else if (e.key === 'Escape') {
      close();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 backdrop-blur-sm pt-[15vh] px-4"
          onClick={close}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: -8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: -8 }}
            className="w-full max-w-lg overflow-hidden rounded-2xl border shadow-2xl"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--surface-border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--surface-border)' }}>
              <Search className="h-5 w-5 shrink-0 text-light-muted dark:text-dark-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search pages and tasks, or jump to a quick action…"
                className="w-full bg-transparent text-sm outline-none"
                style={{ color: 'var(--text)' }}
              />
              <kbd className="hidden shrink-0 rounded border px-1.5 py-0.5 text-[10px] sm:block" style={{ borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }}>
                Esc
              </kbd>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {items.length === 0 && (
                <p className="px-3 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  No matches.
                </p>
              )}
              {items.map((item, i) => {
                const Icon = item.icon;
                return (
                  <button
                    key={`${item.kind}-${item.id}`}
                    onClick={() => choose(item)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors"
                    style={{
                      backgroundColor: i === activeIndex ? 'var(--surface-raised)' : 'transparent',
                      color: 'var(--text)',
                    }}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-brand-500" />
                    <span className="truncate">{item.label}</span>
                    {(item.kind === 'page' || item.kind === 'task') && (
                      <span className="ml-auto shrink-0 text-xs" style={{ color: 'var(--text-muted)' }}>
                        {item.kind === 'page' ? 'Page' : 'Task'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
