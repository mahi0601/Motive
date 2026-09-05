import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch, FiHome, FiCalendar, FiBarChart2, FiLayout, FiSettings, FiPlusCircle, FiFileText,
} from 'react-icons/fi';
import { useCommandPalette } from '../context/CommandPaletteContext';
import { searchPages } from '../services/pageService';
import { useWorkspace } from '../context/WorkspaceContext';

const QUICK_ACTIONS = [
  { id: 'nav-dashboard', label: 'Go to Dashboard', icon: FiHome, path: '/dashboard' },
  { id: 'nav-calendar', label: 'Go to Calendar', icon: FiCalendar, path: '/calendar' },
  { id: 'nav-stats', label: 'Go to Statistics', icon: FiBarChart2, path: '/stats' },
  { id: 'nav-templates', label: 'Go to Templates', icon: FiLayout, path: '/templates' },
  { id: 'nav-settings', label: 'Go to Settings', icon: FiSettings, path: '/settings' },
  { id: 'new-task', label: 'New task', icon: FiPlusCircle, path: '/dashboard?new=task' },
  { id: 'new-page', label: 'New page', icon: FiFileText, path: null }, // handled specially in choose()
];

const CommandPalette = () => {
  const { isOpen, close } = useCommandPalette();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { addPage } = useWorkspace();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Debounced live page search — reuses the existing /api/pages/search endpoint.
  useEffect(() => {
    if (!isOpen || !query.trim()) {
      setResults([]);
      return;
    }
    let active = true;
    const t = setTimeout(async () => {
      try {
        const { data } = await searchPages(query.trim());
        if (active) setResults(data || []);
      } catch {
        if (active) setResults([]);
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

  // Actions first, then live page-search results — one flat list for arrow-key nav.
  const items = useMemo(
    () => [
      ...filteredActions.map((a) => ({ kind: 'action', ...a })),
      ...results.map((p) => ({ kind: 'page', id: p.id, label: p.title || 'Untitled', icon: FiFileText })),
    ],
    [filteredActions, results]
  );

  const choose = async (item) => {
    if (!item) return;
    close();
    if (item.kind !== 'action') {
      navigate(`/page/${item.id}`);
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
              <FiSearch className="h-5 w-5 shrink-0 text-gray-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search pages, or jump to a quick action…"
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
                    {item.kind === 'page' && (
                      <span className="ml-auto shrink-0 text-xs" style={{ color: 'var(--text-muted)' }}>Page</span>
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
