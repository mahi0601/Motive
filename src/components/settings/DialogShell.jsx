import React, { useEffect, useId, useRef } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

// A modal dialog: labelled, Escape closes it (not while `busy`), focus moves in when it opens
// and back where it was when it closes. The title is rendered with `icon`.
const DialogShell = ({ title, icon: Icon, busy = false, onClose, children }) => {
  const titleId = useId();
  const panelRef = useRef(null);
  const busyRef = useRef(busy);
  busyRef.current = busy;

  useEffect(() => {
    const previous = document.activeElement;
    panelRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape' && !busyRef.current) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={() => !busyRef.current && onClose()}
    >
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-light-border bg-light-surface shadow-2xl outline-none dark:border-dark-border dark:bg-dark-raised"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-light-border p-4 dark:border-dark-border">
          <h2 id={titleId} className="flex items-center gap-2 text-sm font-semibold text-brand-600 dark:text-brand-400">
            {Icon && <Icon size={16} aria-hidden="true" />} {title}
          </h2>
          <button type="button" onClick={onClose} disabled={busy} className="rounded p-1 hover:bg-black/10 disabled:opacity-50" aria-label="Close">
            <X size={16} aria-hidden="true" className="text-light-muted dark:text-dark-muted" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
};

export default DialogShell;
