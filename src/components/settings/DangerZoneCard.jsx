import React, { useEffect, useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { deleteAccount, getProfile } from '../../services/userService';
import { logger } from '../../utils/logger';

// Delete account — quiet until you actually commit to it. At rest this reads
// like any other settings card (no red), so scrolling past Settings isn't a
// constant, low-grade warning; the semantic-danger treatment only appears once
// you click through to the confirm step, which is the point where the stakes
// are actually real.
//
// How you confirm depends on the account: a password account re-enters its
// password; a Google-only account (no password) types its own email.
const DangerZoneCard = () => {
  const { user } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [secret, setSecret] = useState(''); // password, or the typed email
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  // null until known; the password field is the safe default meanwhile.
  const [hasPassword, setHasPassword] = useState(null);

  useEffect(() => {
    let active = true;
    getProfile()
      .then(({ data }) => { if (active) setHasPassword(!!data.user.hasPassword); })
      .catch((e) => logger.warn('Failed to load account details', { error: e.message }));
    return () => { active = false; };
  }, []);

  const usesEmail = hasPassword === false;

  const handleDeleteAccount = async () => {
    if (!secret.trim()) {
      setDeleteError(usesEmail ? 'Type your account email to confirm.' : 'Enter your password to confirm.');
      return;
    }
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteAccount(usesEmail ? { confirmEmail: secret.trim() } : { password: secret });
      // Account + all data gone, cookie cleared server-side. Full reload clears
      // the in-memory access token, then land on the home page.
      window.location.assign('/');
    } catch (err) {
      setDeleteError(err?.response?.data?.message || 'Could not delete account.');
      setDeleting(false);
    }
  };

  return (
    <div
      className={`p-5 rounded-xl border shadow-sm transition-colors ${
        confirming
          ? 'border-semantic-danger-200 dark:border-semantic-danger-500/40 bg-semantic-danger-50/40 dark:bg-semantic-danger-500/10'
          : 'border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-raised'
      }`}
    >
      {!confirming ? (
        <>
          <h4 className="text-lg font-semibold text-light-text dark:text-dark-text">Delete account</h4>
          <p className="text-sm text-light-muted dark:text-dark-muted mt-2">
            Permanently remove your account and all its data. This cannot be undone.
          </p>
          <button
            onClick={() => setConfirming(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-light-border dark:border-dark-border px-4 py-2 text-sm font-medium text-light-text dark:text-dark-text transition hover:border-semantic-danger-300 hover:text-semantic-danger-500 dark:hover:border-semantic-danger-500/50 dark:hover:text-semantic-danger-dark"
          >
            <Trash2 className="h-4 w-4" /> Delete account
          </button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-semantic-danger-500 dark:text-semantic-danger-dark" />
            <h4 className="text-lg font-semibold text-semantic-danger-500 dark:text-semantic-danger-dark">This can't be undone</h4>
          </div>
          <p className="text-sm text-light-muted dark:text-dark-muted mt-2">
            All your pages, tasks, and data will be permanently removed.{' '}
            {usesEmail ? (
              <>You signed in with Google, so type your account email{user?.email ? <> (<strong>{user.email}</strong>)</> : null} to confirm.</>
            ) : (
              'Enter your password to confirm.'
            )}
          </p>
          <div className="mt-4 space-y-3">
            <input
              type={usesEmail ? 'email' : 'password'}
              value={secret}
              onChange={(e) => {
                setSecret(e.target.value);
                setDeleteError('');
              }}
              placeholder={usesEmail ? 'Your account email' : 'Your password'}
              aria-label={usesEmail ? 'Account email' : 'Password'}
              autoComplete="off"
              autoFocus
              className="w-full max-w-xs rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-raised px-3 py-2 text-sm text-light-text dark:text-dark-text outline-none focus:border-semantic-danger-500 focus:ring-2 focus:ring-semantic-danger-200 dark:focus:ring-semantic-danger-500/30"
            />
            {deleteError && <p className="text-xs text-semantic-danger-500 dark:text-semantic-danger-dark">{deleteError}</p>}
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="rounded-lg bg-semantic-danger-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {deleting ? 'Deleting…' : 'Permanently delete'}
              </button>
              <button
                onClick={() => {
                  setConfirming(false);
                  setSecret('');
                  setDeleteError('');
                }}
                disabled={deleting}
                className="rounded-lg border border-light-border dark:border-dark-border px-4 py-2 text-sm font-medium text-light-text dark:text-dark-text"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DangerZoneCard;
