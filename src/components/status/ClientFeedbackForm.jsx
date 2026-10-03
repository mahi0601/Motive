import React, { useId, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { sendFeedback } from '../../services/statusService';
import { defaultMilestoneId } from '../../utils/milestones';

const MAX_MESSAGE = 1000;
const MAX_NAME = 60;
const inputClass =
  'w-full rounded-lg border border-light-border bg-light-surface px-3 py-2 text-sm text-light-text dark:border-dark-border dark:bg-dark-raised dark:text-dark-text';

// The client's side of the status page, shown only when the owner turned
// responses on: approve a milestone, ask for changes, or leave a comment. The
// sender needs no account; the name is whatever they type. `website` is a
// honeypot, a field people never see (and screen readers skip) but bots fill:
// the server quietly discards any post that has it set.
const ClientFeedbackForm = ({ token, milestone, milestones, demo = false }) => {
  const nameId = useId();
  const milestoneId = useId();
  const messageId = useId();
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  // The milestones this response can be about. `milestone` is the single one an
  // older server sends. A client's own pick is remembered; if that milestone is gone
  // when the page refreshes, it falls back to the first one not yet approved.
  const list = milestones ?? (milestone ? [milestone] : []);
  const [picked, setPicked] = useState(null);
  const current = list.find((m) => m.id && m.id === picked) || list.find((m) => m.id === defaultMilestoneId(list)) || list[0];

  const submit = async (kind) => {
    setError('');
    if (!name.trim()) return setError('Please enter your name.');
    if (kind !== 'approve' && !message.trim()) return setError('Please write a message.');
    // The example page behaves like the real form (same checks) but sends nothing.
    if (demo) {
      setSent(true);
      return;
    }
    setBusy(true);
    try {
      // Approve and Request changes are about the chosen milestone; a comment is about
      // the page as a whole.
      await sendFeedback(token, {
        kind,
        name: name.trim(),
        message: message.trim(),
        website,
        ...(kind !== 'comment' && current?.id ? { milestoneId: current.id } : {}),
      });
      setSent(true);
    } catch (err) {
      const status = err?.response?.status;
      const reason = err?.response?.data?.message;
      setError(
        status === 429
          ? 'Too many messages. Please try again a little later.'
          : status === 404
            ? 'Responses are no longer available on this page.'
            : status === 422 && typeof reason === 'string'
              ? reason
              : 'Could not send your response. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  const again = () => {
    setSent(false);
    setMessage('');
  };

  return (
    <section
      aria-label="Respond"
      className="relative mt-8 rounded-xl border border-light-border bg-light-surface p-5 dark:border-dark-border dark:bg-dark-raised"
    >
      <h2 className="font-display text-lg font-semibold text-light-text dark:text-white">Your response</h2>
      <p className="mt-1 text-sm text-light-muted dark:text-dark-muted">
        Approve a milestone, ask for changes, or leave a comment. No account needed.
      </p>

      {sent ? (
        <div className="mt-4">
          <p role="status" className="flex items-center gap-2 text-sm text-light-text dark:text-dark-text">
            <CheckCircle2 size={18} className="shrink-0 text-semantic-success-700 dark:text-semantic-success-dark" aria-hidden="true" />
            Thanks — your response has been sent.
          </p>
          {demo && <p className="mt-1 text-xs text-light-muted dark:text-dark-muted">Example only: nothing was sent. On a real page this goes to your inbox.</p>}
          <button
            type="button"
            onClick={again}
            className="mt-3 rounded-lg border border-light-border px-3 py-1.5 text-sm font-medium text-light-text dark:border-dark-border dark:text-dark-text"
          >
            Send another
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor={nameId} className="mb-1 block text-sm font-medium text-light-text dark:text-dark-text">Your name</label>
            <input id={nameId} className={inputClass} maxLength={MAX_NAME} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </div>
          <div>
            <label htmlFor={messageId} className="mb-1 flex items-baseline justify-between text-sm font-medium text-light-text dark:text-dark-text">
              Message
              <span className="text-xs font-normal text-light-muted dark:text-dark-muted">{message.length} / {MAX_MESSAGE}</span>
            </label>
            <textarea id={messageId} rows={3} className={inputClass} maxLength={MAX_MESSAGE} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>

          {list.length > 1 && (
            <div>
              <label htmlFor={milestoneId} className="mb-1 block text-sm font-medium text-light-text dark:text-dark-text">Milestone</label>
              <select
                id={milestoneId}
                className={inputClass}
                value={current?.id || ''}
                onChange={(e) => setPicked(e.target.value)}
              >
                {list.map((m) => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-light-muted dark:text-dark-muted">
                Approve and Request changes apply to this milestone. A comment is about the whole page.
              </p>
            </div>
          )}

          {/* Honeypot: invisible, unfocusable, and hidden from assistive tech. */}
          <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
            <input type="text" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>

          {error && (
            <p role="alert" className="text-sm text-semantic-danger-700 dark:text-semantic-danger-dark">{error}</p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => submit('approve')}
              className="rounded-lg bg-[color:var(--accent-l)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-[color:var(--accent-d)] dark:text-black"
            >
              {current?.title ? `Approve "${current.title}"` : 'Approve'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => submit('changes')}
              className="rounded-lg border border-light-border px-4 py-2 text-sm font-medium text-light-text disabled:opacity-60 dark:border-dark-border dark:text-dark-text"
            >
              Request changes
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => submit('comment')}
              className="rounded-lg border border-light-border px-4 py-2 text-sm font-medium text-light-text disabled:opacity-60 dark:border-dark-border dark:text-dark-text"
            >
              Send comment
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default ClientFeedbackForm;
