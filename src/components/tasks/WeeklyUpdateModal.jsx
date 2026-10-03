import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, FileText, X } from 'lucide-react';
import { buildWeeklyUpdate } from '../../utils/weeklyUpdate';

// A ready-to-send "what moved this week" for the workspace, built from its tasks and
// milestones: shipped, in progress, coming up, overdue. It is plain text to paste into
// an email or a message (so it works without any email set-up), editable before it is
// copied, and made from titles and dates only, like the client status page.
const WeeklyUpdateModal = ({ workspace, tasks, onClose }) => {
  const titleId = useId();
  const textId = useId();
  const panelRef = useRef(null);
  const generated = useMemo(
    () => buildWeeklyUpdate({ workspaceName: workspace.name, tasks, milestones: workspace.milestones || [], now: new Date() }),
    [workspace, tasks]
  );
  const [text, setText] = useState(generated);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  // Dialog behaviour: Escape closes it, focus moves in when it opens and back when it closes.
  useEffect(() => {
    const previous = document.activeElement;
    panelRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copy = async () => {
    setCopied(false);
    setCopyError(false);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopyError(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
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
            <FileText size={16} aria-hidden="true" /> Weekly update
          </h2>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-black/10" aria-label="Close">
            <X size={16} aria-hidden="true" className="text-light-muted dark:text-dark-muted" />
          </button>
        </div>

        <div className="space-y-3 p-5 text-sm text-light-text dark:text-dark-text">
          <p className="text-light-muted dark:text-dark-muted">
            What moved on “{workspace.name}” this week, ready to paste into an email or a message. It uses titles and dates only, never
            descriptions. Edit it before you copy it.
          </p>
          <div>
            <label htmlFor={textId} className="mb-1 block font-medium">Update text</label>
            <textarea
              id={textId}
              rows={14}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setCopied(false);
              }}
              className="w-full rounded-lg border border-light-border bg-light-surface px-3 py-2 font-mono text-xs text-light-text dark:border-dark-border dark:bg-dark-raised dark:text-dark-text"
            />
          </div>
          {copyError && (
            <p role="alert" className="text-semantic-danger-700 dark:text-semantic-danger-dark">
              Could not copy automatically. Select the text and copy it by hand.
            </p>
          )}
          {copied && (
            <p role="status" className="text-light-muted dark:text-dark-muted">Copied. Paste it into your message.</p>
          )}
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-4 py-2 font-medium text-white shadow-brand-sm transition hover:shadow-brand"
          >
            <Copy size={16} aria-hidden="true" />
            Copy to clipboard
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WeeklyUpdateModal;
