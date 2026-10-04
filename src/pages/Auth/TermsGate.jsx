import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { LogoMark } from '../../components/ui/Logo';
import { acceptTerms } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';

// Shown in place of the app to a brand-new account made with Google, which has no
// sign-up checkbox. It holds the whole app until the person agrees, once; the server
// records when, and which version. Anyone who would rather not agree can log out.
const TermsGate = () => {
  const { user, refreshUser, logout } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  const submit = async (e) => {
    e.preventDefault();
    if (busyRef.current) return;
    if (!agreed) {
      setError('Please confirm you are 16 or older and agree to the Terms and Privacy Policy.');
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      await acceptTerms(true);
      // The profile now says nothing is pending, which lets the app through.
      await refreshUser();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not save that. Please try again.');
      busyRef.current = false;
      setBusy(false);
    }
  };

  const firstName = user?.name?.split(' ')[0];

  return (
    <main className="flex min-h-screen items-center justify-center bg-light-background px-6 py-12 dark:bg-dark-background">
      <div className="w-full max-w-md rounded-2xl border border-light-border bg-light-surface p-8 shadow-lg dark:border-dark-border dark:bg-dark-raised">
        <LogoMark size={40} />
        <h1 className="mt-4 font-display text-2xl font-bold text-light-text dark:text-white">One more step{firstName ? `, ${firstName}` : ''}</h1>
        <p className="mt-2 text-sm text-light-muted dark:text-dark-muted">
          You signed up with Google, so there was no box to tick. Before you start, please confirm the following.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          <div>
            <label className="flex items-start gap-2 text-sm text-light-muted dark:text-dark-muted">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => {
                  setAgreed(e.target.checked);
                  setError('');
                }}
                aria-invalid={!!error && !agreed}
                aria-describedby={error ? 'terms-gate-error' : undefined}
                className="mt-0.5 h-4 w-4 rounded border-light-border text-brand-600 focus:ring-brand-500"
              />
              <span>
                I am 16 or older and agree to the{' '}
                <Link to="/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-brand-600 hover:underline dark:text-brand-400">Terms</Link>
                {' '}and{' '}
                <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="font-medium text-brand-600 hover:underline dark:text-brand-400">Privacy Policy</Link>.
              </span>
            </label>
          </div>

          {error && (
            <p id="terms-gate-error" role="alert" className="flex items-start gap-2 text-sm text-semantic-danger-700 dark:text-semantic-danger-dark">
              <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-brand-gradient py-3 font-semibold text-white shadow-brand-sm transition hover:shadow-brand disabled:opacity-60"
          >
            {busy ? 'Saving…' : 'Continue'}
          </button>
        </form>

        <button type="button" onClick={logout} className="mt-4 w-full text-center text-sm text-light-muted hover:underline dark:text-dark-muted">
          Log out instead
        </button>
      </div>
    </main>
  );
};

export default TermsGate;
