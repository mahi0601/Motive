import React, { useEffect, useId, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, X } from 'lucide-react';
import { duplicateWorkspace } from '../../services/workspaceService';

const COPY_OPTIONS = [
  { key: 'tasks', label: 'Tasks and their checklists', hint: 'Reset to To do' },
  { key: 'pages', label: 'Pages', hint: 'With their content' },
  { key: 'milestones', label: 'Milestones', hint: 'Without any approvals' },
  { key: 'statusText', label: 'Status page wording', hint: 'Headline, summary and colour' },
];

const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Start the next client from this one: copies the STRUCTURE (tasks, pages, milestones,
// status page wording) into a new workspace so onboarding is not rebuilt by hand. It says
// plainly what is never copied, because the point is that one client's material does not
// reach the next.
const DuplicateWorkspaceModal = ({ workspace, onClose, onCreated }) => {
  const titleId = useId();
  const nameId = useId();
  const dateId = useId();
  const panelRef = useRef(null);
  const busyRef = useRef(false);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(todayLocal);
  const [include, setInclude] = useState({ tasks: true, pages: true, milestones: true, statusText: true });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Dialog behaviour: Escape closes it (not while it is working), focus moves in when it
  // opens and back where it was when it closes.
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

  const submit = async (e) => {
    e.preventDefault();
    if (busyRef.current) return;
    if (!name.trim()) {
      setError('Give the new client a name.');
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      const { data } = await duplicateWorkspace(workspace.id, {
        name: name.trim(),
        ...(startDate ? { startDate } : {}),
        include,
      });
      onCreated({ workspace: data.workspace, counts: data.counts });
    } catch (err) {
      const reason = err?.response?.data?.message;
      setError(reason ? `${reason} Nothing was created.` : 'Could not create the new client. Nothing was created. Please try again.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

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
            <Copy size={16} aria-hidden="true" /> New client from this one
          </h2>
          <button type="button" onClick={onClose} disabled={busy} className="rounded p-1 hover:bg-black/10 disabled:opacity-50" aria-label="Close">
            <X size={16} aria-hidden="true" className="text-light-muted dark:text-dark-muted" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-5 text-sm text-light-text dark:text-dark-text" noValidate>
          <p className="text-light-muted dark:text-dark-muted">
            Set up the next client the same way as “{workspace.name}”: the same tasks, pages and milestones, ready to adjust. You can
            turn on its client status link when you are ready.
          </p>

          <div>
            <label htmlFor={nameId} className="mb-1 block font-medium">Name of the new client</label>
            <input
              id={nameId}
              value={name}
              maxLength={100}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              className="w-full rounded-lg border border-light-border bg-light-surface px-3 py-2 text-light-text dark:border-dark-border dark:bg-dark-raised dark:text-dark-text"
            />
          </div>

          <div>
            <label htmlFor={dateId} className="mb-1 block font-medium">Start date</label>
            <input
              id={dateId}
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-light-border bg-light-surface px-3 py-2 text-light-text dark:border-dark-border dark:bg-dark-raised dark:text-dark-text"
            />
            <p className="mt-1 text-xs text-light-muted dark:text-dark-muted">
              Every date moves by the same amount, so your earliest date lands here and the gaps between dates stay the same. Clear it to
              leave the dates empty.
            </p>
          </div>

          <fieldset>
            <legend className="mb-1 font-medium">What to copy</legend>
            <div className="space-y-1.5">
              {COPY_OPTIONS.map(({ key, label, hint }) => (
                <label key={key} className="flex cursor-pointer items-start gap-2">
                  <input
                    type="checkbox"
                    checked={include[key]}
                    onChange={(e) => setInclude((cur) => ({ ...cur, [key]: e.target.checked }))}
                    className="mt-0.5 h-4 w-4 rounded border-light-border text-brand-600 focus:ring-brand-500"
                    aria-label={label}
                  />
                  <span>
                    {label} <span className="text-xs text-light-muted dark:text-dark-muted">· {hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <p className="rounded-lg border border-light-border bg-light-border/30 px-3 py-2 text-xs text-light-muted dark:border-dark-border dark:bg-dark-surface dark:text-dark-muted">
            Not copied, so one client’s material never reaches the next: comments, files, images and embeds (a short note is left in their
            place), people and invites, client responses and sign-offs, and the status link.
          </p>

          {error && (
            <p role="alert" className="rounded-lg border border-semantic-danger-200 bg-semantic-danger-50 px-3 py-2 text-semantic-danger-700 dark:border-semantic-danger-500/30 dark:bg-semantic-danger-500/10 dark:text-semantic-danger-dark">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-brand-gradient px-4 py-2 font-medium text-white shadow-brand-sm transition hover:shadow-brand disabled:opacity-60"
          >
            {busy ? 'Creating…' : 'Create client'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default DuplicateWorkspaceModal;
