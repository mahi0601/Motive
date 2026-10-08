import React, { useCallback, useEffect, useId, useState } from 'react';
import { Mail, Trash2 } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  addSubscriber,
  listSubscribers,
  removeSubscriber,
  sendWeeklyEmailPreview,
  updateStatusPage,
} from '../../services/workspaceService';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const inputClass =
  'w-full rounded-lg border border-light-border bg-light-surface px-3 py-2 text-sm text-light-text dark:border-dark-border dark:bg-dark-raised dark:text-dark-text';

const messageOf = (err, fallback) => err?.response?.data?.message || fallback;

// The weekly "what moved" email for one client: a switch, the day it goes out (in the owner's
// time zone, from 9am), the people who get it, and a preview sent to the owner. It saves as you go,
// separate from the details form above. The email carries titles and dates only, like the page.
const WeeklyEmailCard = () => {
  const { workspace, loadWorkspace } = useWorkspace();
  const ids = { enabled: useId(), day: useId(), email: useId() };
  const [people, setPeople] = useState([]);
  const [limit, setLimit] = useState(null);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  const enabled = !!workspace.statusDigestEnabled;
  const day = Number.isInteger(workspace.statusDigestDay) ? workspace.statusDigestDay : 1;

  const load = useCallback(async () => {
    try {
      const { data } = await listSubscribers(workspace.id);
      setPeople(data.items || []);
      setLimit(data.limit ?? null);
    } catch {
      setError('Could not load the list. Try again.');
    }
  }, [workspace.id]);
  useEffect(() => { load(); }, [load]);

  const run = async (fn, failure) => {
    setBusy(true);
    setError('');
    setNote('');
    try {
      await fn();
    } catch (err) {
      setError(messageOf(err, failure));
    } finally {
      setBusy(false);
    }
  };

  const change = (patch) => run(async () => {
    await updateStatusPage(workspace.id, patch);
    await loadWorkspace();
  }, 'Could not save. Try again.');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    run(async () => {
      await addSubscriber(workspace.id, { email: email.trim() });
      setEmail('');
      await load();
    }, 'Could not add that address.');
  };

  const handleRemove = (id) => run(async () => {
    await removeSubscriber(workspace.id, id);
    await load();
  }, 'Could not remove that address.');

  const handlePreview = () => run(async () => {
    const { data } = await sendWeeklyEmailPreview(workspace.id);
    setNote(`Preview sent to ${data.sentTo}.`);
  }, 'Could not send the preview.');

  const active = people.filter((p) => !p.unsubscribed).length;
  const full = limit !== null && people.length >= limit;

  return (
    <section aria-label="Weekly email to your client" className="mt-5 space-y-4 border-t border-light-border pt-5 dark:border-dark-border">
      <div className="flex items-start gap-3">
        <Mail className="mt-0.5 h-5 w-5 text-brand-500" aria-hidden="true" />
        <div>
          <h5 className="font-semibold text-light-text dark:text-dark-text">Weekly email to your client</h5>
          <p className="mt-1 text-sm text-light-muted dark:text-dark-muted">
            Send a short "what moved this week" email with a link to the live page. It lists task titles and dates only, nothing
            private, and a week with nothing finished or in progress is skipped.
          </p>
        </div>
      </div>

      <label htmlFor={ids.enabled} className="flex items-center gap-2 text-sm text-light-text dark:text-dark-text">
        <input
          id={ids.enabled}
          type="checkbox"
          checked={enabled}
          disabled={busy}
          onChange={(e) => change({ digestEnabled: e.target.checked })}
        />
        Email my client every week
      </label>

      {enabled && (
        <div className="max-w-xs">
          <label htmlFor={ids.day} className="mb-1 block text-sm font-medium text-light-text dark:text-dark-text">
            Send on
          </label>
          <select id={ids.day} className={inputClass} value={day} disabled={busy} onChange={(e) => change({ digestDay: Number(e.target.value) })}>
            {DAYS.map((d, i) => (
              <option key={d} value={i}>{d}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-light-muted dark:text-dark-muted">Sent from 9am in your time zone.</p>
        </div>
      )}

      <div>
        <h6 className="text-sm font-medium text-light-text dark:text-dark-text">
          Who gets it{limit !== null ? ` (${people.length} of ${limit})` : ''}
        </h6>
        <ul className="mt-2 space-y-1">
          {people.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 text-sm text-light-text dark:text-dark-text">
              <span className="truncate">
                {p.email}
                {p.unsubscribed && <span className="ml-2 text-xs text-light-muted dark:text-dark-muted">unsubscribed</span>}
              </span>
              <button
                type="button"
                aria-label={`Remove ${p.email}`}
                disabled={busy}
                onClick={() => handleRemove(p.id)}
                className="rounded p-1 text-light-muted hover:text-semantic-danger-700 dark:text-dark-muted"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={handleAdd} className="mt-2 flex gap-2">
          <label htmlFor={ids.email} className="sr-only">Client email address</label>
          <input
            id={ids.email}
            type="email"
            className={inputClass}
            placeholder="client@company.com"
            value={email}
            maxLength={254}
            disabled={full}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            disabled={busy || full || !email.trim()}
            className="shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            Add
          </button>
        </form>
        {full && <p className="mt-1 text-xs text-light-muted dark:text-dark-muted">Your plan includes {limit} per client.</p>}
        <p className="mt-2 text-xs text-light-muted dark:text-dark-muted">
          Only add people who expect to hear from you. Every email has an unsubscribe link.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handlePreview}
          disabled={busy}
          className="rounded-lg border border-light-border px-3 py-2 text-sm font-medium text-light-text transition hover:border-brand-500 dark:border-dark-border dark:text-dark-text"
        >
          Send me a preview
        </button>
        {enabled && active === 0 && (
          <span className="text-xs text-light-muted dark:text-dark-muted">Add at least one address for the email to go out.</span>
        )}
      </div>

      <div aria-live="polite">
        {note && <p className="text-sm text-semantic-success-700 dark:text-semantic-success-dark">{note}</p>}
        {error && <p role="alert" className="text-sm text-semantic-danger-700 dark:text-semantic-danger-dark">{error}</p>}
      </div>
    </section>
  );
};

export default WeeklyEmailCard;
