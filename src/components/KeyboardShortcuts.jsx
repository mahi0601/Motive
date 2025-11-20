import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCommand } from 'react-icons/fi';

const KeyboardShortcuts = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
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
    { key: 'N', description: 'Create new task', action: 'Ctrl/Cmd + N' },
    { key: 'K', description: 'Open shortcuts', action: 'Ctrl/Cmd + K' },
    { key: 'F', description: 'Focus search', action: 'Ctrl/Cmd + F' },
    { key: 'Escape', description: 'Close modals', action: 'Esc' },
    { key: '/', description: 'Quick search', action: '/' },
    { key: '?', description: 'Show shortcuts', action: '?' },
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
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <FiCommand className="w-6 h-6 text-indigo-500" />
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Keyboard Shortcuts
                  </h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5 text-gray-500" />
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
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-indigo-500 transition-colors"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {shortcut.description}
                      </span>
                      <kbd className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-mono text-gray-800 dark:text-gray-200 shadow-sm">
                        {shortcut.action}
                      </kbd>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl">
                  <p className="text-sm text-indigo-700 dark:text-indigo-300">
                    💡 Tip: Press <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs">Ctrl/Cmd + K</kbd> anytime to open this menu
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
        className="fixed bottom-6 right-6 p-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all z-40"
        title="Keyboard Shortcuts (Ctrl/Cmd + K)"
      >
        <FiCommand className="w-5 h-5" />
      </motion.button>
    </>
  );
};

export default KeyboardShortcuts;

