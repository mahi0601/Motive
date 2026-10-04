import React, { useId, useRef, useState } from 'react';
import { BookmarkPlus } from 'lucide-react';
import DialogShell from './DialogShell';
import { saveClientTemplate } from '../../services/clientTemplateService';

const FIELD = 'w-full rounded-lg border border-light-border bg-light-surface px-3 py-2 text-light-text dark:border-dark-border dark:bg-dark-raised dark:text-dark-text';

// Keep this client's structure as a template for the next one. It says plainly what is left
// out, because a template is reused for other clients.
const SaveClientTemplateModal = ({ workspace, onClose, onSaved }) => {
  const nameId = useId();
  const descId = useId();
  const busyRef = useRef(false);
  const [name, setName] = useState(workspace.name || '');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (busyRef.current) return;
    if (!name.trim()) {
      setError('Give the template a name.');
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      const { data } = await saveClientTemplate({ workspaceId: workspace.id, name: name.trim(), description: description.trim() });
      onSaved(data.template);
    } catch (err) {
      const reason = err?.response?.data?.message;
      setError(reason ? `${reason} Nothing was saved.` : 'Could not save the template. Nothing was saved. Please try again.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <DialogShell title="Save as client template" icon={BookmarkPlus} busy={busy} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4 p-5 text-sm text-light-text dark:text-dark-text" noValidate>
        <p className="text-light-muted dark:text-dark-muted">
          Keep the tasks, pages, milestones and status page wording of “{workspace.name}” so you can start the next client from them.
        </p>
        <div>
          <label htmlFor={nameId} className="mb-1 block font-medium">Template name</label>
          <input id={nameId} value={name} maxLength={100} onChange={(e) => { setName(e.target.value); setError(''); }} className={FIELD} />
        </div>
        <div>
          <label htmlFor={descId} className="mb-1 block font-medium">Description <span className="font-normal text-light-muted dark:text-dark-muted">(optional)</span></label>
          <textarea id={descId} value={description} maxLength={300} rows={2} onChange={(e) => setDescription(e.target.value)} className={FIELD} />
        </div>
        <p className="rounded-lg border border-light-border bg-light-border/30 px-3 py-2 text-xs text-light-muted dark:border-dark-border dark:bg-dark-surface dark:text-dark-muted">
          Not saved, so one client’s material never reaches the next: comments, files, images and embeds (a short note is left in their
          place), people and invites, client responses and sign-offs, and the status link. Dates are kept as gaps, not calendar dates.
        </p>
        {error && (
          <p role="alert" className="rounded-lg border border-semantic-danger-200 bg-semantic-danger-50 px-3 py-2 text-semantic-danger-700 dark:border-semantic-danger-500/30 dark:bg-semantic-danger-500/10 dark:text-semantic-danger-dark">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="rounded-lg bg-brand-gradient px-4 py-2 font-medium text-white shadow-brand-sm transition hover:shadow-brand disabled:opacity-60">
          {busy ? 'Saving…' : 'Save template'}
        </button>
      </form>
    </DialogShell>
  );
};

export default SaveClientTemplateModal;
