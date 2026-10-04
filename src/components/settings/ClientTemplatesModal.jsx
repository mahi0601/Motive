import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Bookmark } from 'lucide-react';
import DialogShell from './DialogShell';
import { listClientTemplates, deleteClientTemplate, createClientFromTemplate } from '../../services/clientTemplateService';

const FIELD = 'rounded-lg border border-light-border bg-light-surface px-3 py-2 text-light-text dark:border-dark-border dark:bg-dark-raised dark:text-dark-text';
const BTN = 'rounded-lg border border-light-border px-3 py-1.5 text-xs font-medium hover:bg-black/5 disabled:opacity-60 dark:border-dark-border dark:hover:bg-white/5';

const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const part = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const summary = (c = {}) => `${part(c.tasks ?? 0, 'task', 'tasks')} · ${part(c.pages ?? 0, 'page', 'pages')} · ${part(c.milestones ?? 0, 'milestone', 'milestones')}`;

// The owner's saved client templates: start a new client from one, or delete it.
const ClientTemplatesModal = ({ onClose, onCreated }) => {
  const nameId = useId();
  const dateId = useId();
  const busyRef = useRef(false);
  const [templates, setTemplates] = useState(null); // null = loading
  const [loadError, setLoadError] = useState(false);
  const [using, setUsing] = useState(null); // the template being used
  const [confirming, setConfirming] = useState(null); // the template whose delete awaits confirmation
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(todayLocal);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoadError(false);
    setTemplates(null);
    try {
      const { data } = await listClientTemplates();
      setTemplates(data.templates || []);
    } catch {
      setLoadError(true);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const guarded = async (fn, failure) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (err) {
      const reason = err?.response?.data?.message;
      setError(reason || failure);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const create = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Give the new client a name.');
      return;
    }
    return guarded(async () => {
      const { data } = await createClientFromTemplate(using.id, { name: name.trim(), ...(startDate ? { startDate } : {}) });
      onCreated({ workspace: data.workspace, counts: data.counts });
    }, 'Could not create the new client. Nothing was created. Please try again.');
  };

  const remove = (t) =>
    guarded(async () => {
      await deleteClientTemplate(t.id);
      setTemplates((cur) => cur.filter((x) => x.id !== t.id));
      setConfirming(null);
    }, 'Could not delete that template. Please try again.');

  const errorBox = error && (
    <p role="alert" className="rounded-lg border border-semantic-danger-200 bg-semantic-danger-50 px-3 py-2 text-sm text-semantic-danger-700 dark:border-semantic-danger-500/30 dark:bg-semantic-danger-500/10 dark:text-semantic-danger-dark">
      {error}
    </p>
  );

  return (
    <DialogShell title="Client templates" icon={Bookmark} busy={busy} onClose={onClose}>
      {using ? (
        <form onSubmit={create} className="space-y-4 p-5 text-sm text-light-text dark:text-dark-text" noValidate>
          <p className="text-light-muted dark:text-dark-muted">
            New client from “{using.name}”: {summary(using.counts)}. You can turn on its client status link when you are ready.
          </p>
          <div>
            <label htmlFor={nameId} className="mb-1 block font-medium">Name of the new client</label>
            <input id={nameId} value={name} maxLength={100} onChange={(e) => { setName(e.target.value); setError(''); }} className={`w-full ${FIELD}`} />
          </div>
          <div>
            <label htmlFor={dateId} className="mb-1 block font-medium">Start date</label>
            <input id={dateId} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={FIELD} />
            <p className="mt-1 text-xs text-light-muted dark:text-dark-muted">
              The earliest date lands here and the gaps between dates stay the same. Clear it to leave the dates empty.
            </p>
          </div>
          {errorBox}
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="rounded-lg bg-brand-gradient px-4 py-2 font-medium text-white shadow-brand-sm transition hover:shadow-brand disabled:opacity-60">
              {busy ? 'Creating…' : 'Create client'}
            </button>
            <button type="button" disabled={busy} onClick={() => { setUsing(null); setError(''); }} className={BTN}>Back to templates</button>
          </div>
        </form>
      ) : (
        <div className="space-y-3 p-5 text-sm text-light-text dark:text-dark-text">
          {loadError ? (
            <div role="alert" className="space-y-2">
              <p>Could not load your templates.</p>
              <button type="button" onClick={load} className={BTN}>Try again</button>
            </div>
          ) : templates === null ? (
            <p role="status" className="text-light-muted dark:text-dark-muted">Loading templates…</p>
          ) : templates.length === 0 ? (
            <p className="text-light-muted dark:text-dark-muted">
              No templates yet. Open a client, then choose “Save as client template” on the Members card to keep it for next time.
            </p>
          ) : (
            <ul aria-label="Client templates" className="space-y-2">
              {templates.map((t) => (
                <li key={t.id} aria-label={t.name} className="rounded-lg border border-light-border p-3 dark:border-dark-border">
                  <p className="font-medium">{t.name}</p>
                  {t.description && <p className="text-light-muted dark:text-dark-muted">{t.description}</p>}
                  <p className="text-xs text-light-muted dark:text-dark-muted">{summary(t.counts)}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button type="button" disabled={busy} onClick={() => { setUsing(t); setName(''); setError(''); }} className={BTN} aria-label={`Use ${t.name}`}>Use template</button>
                    {confirming === t.id ? (
                      <>
                        <span className="text-xs">Delete this template? Clients already made from it are not affected.</span>
                        <button type="button" disabled={busy} onClick={() => remove(t)} className={`${BTN} text-semantic-danger-700`} aria-label={`Confirm delete ${t.name}`}>Delete</button>
                        <button type="button" disabled={busy} onClick={() => setConfirming(null)} className={BTN}>Keep</button>
                      </>
                    ) : (
                      <button type="button" disabled={busy} onClick={() => { setConfirming(t.id); setError(''); }} className={BTN} aria-label={`Delete ${t.name}`}>Delete</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {errorBox}
        </div>
      )}
    </DialogShell>
  );
};

export default ClientTemplatesModal;
