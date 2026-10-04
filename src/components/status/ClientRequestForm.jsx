import React, { useId, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { sendRequest } from '../../services/statusService';

const MAX_NAME = 60;
const MAX_TITLE = 120;
const MAX_DETAILS = 1000;
const inputClass =
  'w-full rounded-lg border border-light-border bg-light-surface px-3 py-2 text-sm text-light-text dark:border-dark-border dark:bg-dark-raised dark:text-dark-text';

// "Ask for something": shown only when the owner turned requests on. The sender needs no
// account and the name is whatever they type. `website` is a honeypot, a field people never
// see (and screen readers skip) but bots fill: the server quietly discards any post with it set.
const ClientRequestForm = ({ token, demo = false }) => {
  const nameId = useId();
  const titleId = useId();
  const detailsId = useId();
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [website, setWebsite] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Please enter your name.');
    if (!title.trim()) return setError('Please say what you need.');
    // The example page behaves like the real form (same checks) but sends nothing.
    if (demo) {
      setSent(true);
      return;
    }
    setBusy(true);
    try {
      await sendRequest(token, { name: name.trim(), title: title.trim(), details: details.trim(), website });
      setSent(true);
    } catch (err) {
      const status = err?.response?.status;
      const reason = err?.response?.data?.message;
      setError(
        status === 429
          ? 'Too many requests. Please try again a little later.'
          : status === 404
            ? 'Requests are no longer available on this page.'
            : status === 422 && typeof reason === 'string'
              ? reason
              : 'Could not send your request. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  const again = () => {
    setSent(false);
    setTitle('');
    setDetails('');
  };

  return (
    <section
      aria-label="Ask for something"
      className="relative mt-8 rounded-xl border border-light-border bg-light-surface p-5 dark:border-dark-border dark:bg-dark-raised"
    >
      <h2 className="font-display text-lg font-semibold text-light-text dark:text-white">Ask for something</h2>
      <p className="mt-1 text-sm text-light-muted dark:text-dark-muted">
        Need something that is not on the list? Send a request and you can follow it on this page. No account needed.
      </p>

      {sent ? (
        <div className="mt-4">
          <p role="status" className="flex items-center gap-2 text-sm text-light-text dark:text-dark-text">
            <CheckCircle2 size={18} className="shrink-0 text-semantic-success-700 dark:text-semantic-success-dark" aria-hidden="true" />
            Thanks — your request has been sent.
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
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div>
            <label htmlFor={nameId} className="mb-1 block text-sm font-medium text-light-text dark:text-dark-text">Your name</label>
            <input id={nameId} className={inputClass} maxLength={MAX_NAME} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </div>
          <div>
            <label htmlFor={titleId} className="mb-1 block text-sm font-medium text-light-text dark:text-dark-text">What do you need?</label>
            <input id={titleId} className={inputClass} maxLength={MAX_TITLE} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label htmlFor={detailsId} className="mb-1 flex items-baseline justify-between text-sm font-medium text-light-text dark:text-dark-text">
              Details (optional)
              <span className="text-xs font-normal text-light-muted dark:text-dark-muted">{details.length} / {MAX_DETAILS}</span>
            </label>
            <textarea id={detailsId} rows={3} className={inputClass} maxLength={MAX_DETAILS} value={details} onChange={(e) => setDetails(e.target.value)} />
          </div>

          {/* Honeypot: invisible, unfocusable, and hidden from assistive tech. */}
          <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
            <input type="text" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>

          {error && <p role="alert" className="text-sm text-semantic-danger-700 dark:text-semantic-danger-dark">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-[color:var(--accent-l)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-[color:var(--accent-d)] dark:text-black"
          >
            {busy ? 'Sending…' : 'Send request'}
          </button>
        </form>
      )}
    </section>
  );
};

export default ClientRequestForm;
