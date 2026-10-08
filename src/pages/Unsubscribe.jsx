import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { LogoMark } from '../components/ui/Logo';
import { getUnsubscribeInfo, unsubscribeFromUpdates } from '../services/statusService';

// Public: the personal link in a client's weekly email. No account, one button. Opening the link
// changes nothing (mail scanners follow links); only the button unsubscribes.
const Unsubscribe = () => {
  const { token } = useParams();
  const [state, setState] = useState({ loading: true });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getUnsubscribeInfo(token)
      .then(({ data }) => { if (active) setState({ loading: false, name: data.workspaceName, done: data.unsubscribed }); })
      .catch(() => { if (active) setState({ loading: false, missing: true }); });
    return () => { active = false; };
  }, [token]);

  const handle = async () => {
    setBusy(true);
    setError('');
    try {
      await unsubscribeFromUpdates(token);
      setState((s) => ({ ...s, done: true }));
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  let body;
  if (state.loading) {
    body = <Loader2 className="mx-auto h-6 w-6 animate-spin text-light-muted dark:text-dark-muted" aria-label="Loading" />;
  } else if (state.missing) {
    body = (
      <>
        <h1 className="font-display text-xl font-bold text-light-text dark:text-white">This link is not available</h1>
        <p className="mt-3 text-sm text-light-muted dark:text-dark-muted">It may have been removed. If you still get emails you do not want, reply to one and ask to be taken off.</p>
      </>
    );
  } else if (state.done) {
    body = (
      <>
        <h1 className="font-display text-xl font-bold text-light-text dark:text-white">You are unsubscribed</h1>
        <p className="mt-3 text-sm text-light-muted dark:text-dark-muted">You will not get the weekly update for {state.name} any more.</p>
      </>
    );
  } else {
    body = (
      <>
        <h1 className="font-display text-xl font-bold text-light-text dark:text-white">Stop the weekly update?</h1>
        <p className="mt-3 text-sm text-light-muted dark:text-dark-muted">You will no longer get the weekly email for {state.name}.</p>
        <button
          type="button"
          onClick={handle}
          disabled={busy}
          className="mt-6 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          Unsubscribe
        </button>
        {error && <p role="alert" className="mt-3 text-sm text-semantic-danger-700 dark:text-semantic-danger-dark">{error}</p>}
      </>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-light-background px-6 dark:bg-dark-background">
      <div className="w-full max-w-md text-center">
        <LogoMark />
        <div className="mt-6">{body}</div>
        <Link to="/" className="mt-8 inline-block text-xs text-light-muted hover:underline dark:text-dark-muted">Clientglass</Link>
      </div>
    </div>
  );
};

export default Unsubscribe;
