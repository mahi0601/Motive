import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command, X } from 'lucide-react';

const KeyboardShortcuts = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const isEditableTarget = (el) =>
      el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

    const handleKeyDown = (e) => {
      // '?' opens this reference modal — Cmd/Ctrl+K now opens the real
      // command palette instead (see CommandPaletteContext).
      if (e.key === '?' && !isEditableTarget(e.target)) {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const shortcuts = [
    { key: 'K', description: 'Open command palette / search', action: 'Ctrl/Cmd + K' },
    { key: 'Escape', description: 'Close modals', action: 'Esc' },
    { key: '?', description: 'Show this shortcuts reference', action: '?' },
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-light-surface dark:bg-dark-raised rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-light-surface dark:bg-dark-raised border-b border-light-border dark:border-dark-border px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Command className="w-6 h-6 text-brand-500" />
                  <h3 className="text-2xl font-bold text-light-text dark:text-white">
                    Keyboard Shortcuts
                  </h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-light-border/40 dark:hover:bg-dark-border rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-light-muted" />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {shortcuts.map((shortcut, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 bg-light-background dark:bg-dark-surface/50 rounded-xl border border-light-border dark:border-dark-border hover:border-brand-500 transition-colors"
                    >
                      <span className="text-sm text-light-text dark:text-dark-text">
                        {shortcut.description}
                      </span>
                      <kbd className="px-3 py-1.5 bg-light-surface dark:bg-dark-raised border border-light-border dark:border-dark-border rounded-lg text-xs font-mono text-light-text dark:text-dark-text shadow-sm">
                        {shortcut.action}
                      </kbd>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl">
                  <p className="text-sm text-brand-700 dark:text-brand-300">
                    💡 Tip: Press <kbd className="px-2 py-1 bg-light-surface dark:bg-dark-raised rounded text-xs">?</kbd> anytime to open this menu, or <kbd className="px-2 py-1 bg-light-surface dark:bg-dark-raised rounded text-xs">Ctrl/Cmd + K</kbd> for the command palette
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-3 bg-brand-gradient text-white rounded-full shadow-lg hover:shadow-xl transition-all z-40"
        title="Keyboard Shortcuts (?)"
      >
        <Command className="w-5 h-5" />
      </motion.button>
    </>
  );
};

export default KeyboardShortcuts;

