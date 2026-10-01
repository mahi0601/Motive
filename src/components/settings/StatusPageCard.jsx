import React, { useState } from 'react';
import { Check, Copy, Link2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { enableShare, disableShare } from '../../services/workspaceService';
import { CARD_CLASS } from './cardStyles';

// Where the public link points. In the browser that's simply this site; the
// Android app runs from its own origin (https://localhost), which no client
// could open, so a deployment can set VITE_PUBLIC_APP_URL to its real address.
const publicBase = () => (import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, '');

// Owner-only control for the workspace's public, read-only client status page
// (served at /s/:token — see pages/StatusPage.jsx). The raw token exists only
// in the response that creates it: the server stores just its hash, so a link
// can be shown once, at creation, and never again.
const StatusPageCard = () => {
  const { user } = useAuth();
  const { workspace, loadWorkspace } = useWorkspace();
  const [link, setLink] = useState(''); // only ever set right after enable/regenerate
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmingOff, setConfirmingOff] = useState(false);

  const isOwner = !!workspace && workspace.ownerId === user?.id;
  if (!isOwner) return null;

  const enabled = !!workspace.shareEnabledAt;

  const handleEnable = async () => {
    setBusy(true);
    setError('');
    setCopied(false);
    try {
      const { data } = await enableShare(workspace.id);
      setLink(`${publicBase()}/s/${data.share.token}`);
      await loadWorkspace(); // picks up shareEnabledAt
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not create the status link.');
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    setError('');
    try {
      await disableShare(workspace.id);
      setLink('');
      setConfirmingOff(false);
      await loadWorkspace();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not turn off the status link.');
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setError('Could not copy automatically — select the link and copy it by hand.');
    }
  };

  return (
    <div className={CARD_CLASS}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link2 className="text-brand-500" />
          <h4 className="text-lg font-semibold">Client status page</h4>
        </div>
        {enabled && (
          <span className="inline-flex items-center rounded-lg bg-semantic-success-50 px-3 py-1.5 text-sm font-medium text-semantic-success-500 dark:bg-semantic-success-500/10 dark:text-semantic-success-dark">
            Sharing is on
          </span>
        )}
      </div>

      <p className="mt-2 text-sm text-light-muted dark:text-dark-muted">
        Give a client a link to a live, read-only view of “{workspace.name}”. No account needed.
      </p>
      <p className="mt-2 rounded-lg border border-semantic-warning-200 bg-semantic-warning-50 px-3 py-2 text-xs text-semantic-warning-500 dark:border-semantic-warning-500/30 dark:bg-semantic-warning-500/10 dark:text-semantic-warning-dark">
        Anyone with the link can see every task’s <strong>title, status and dates</strong> in this workspace. People’s names,
        descriptions, comments and files are never shown. Keep confidential details out of task titles.
      </p>

      {link && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-light-muted dark:text-dark-muted">
            Your link — copy it now, it won’t be shown again
          </p>
          <div className="flex gap-2">
            <input
              readOnly
              value={link}
              onFocus={(e) => e.target.select()}
              aria-label="Status page link"
              className="min-w-0 flex-1 rounded-lg border border-light-border bg-light-surface px-3 py-2 text-sm text-light-text dark:border-dark-border dark:bg-dark-raised dark:text-dark-text"
            />
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg border border-brand-600 px-3 py-2 text-sm font-medium text-brand-600 transition hover:bg-brand-600 hover:text-white dark:border-white dark:text-white"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {enabled && !link && (
        <p className="mt-3 text-sm text-light-muted dark:text-dark-muted">
          For security the link can only be shown when it’s created. Replace it to get a new one — the old link stops working
          immediately.
        </p>
      )}

      {error && <p className="mt-2 text-xs text-semantic-danger-500 dark:text-semantic-danger-dark">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {!enabled ? (
          <button
            onClick={handleEnable}
            disabled={busy}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
          >
            {busy ? 'Creating…' : 'Create status link'}
          </button>
        ) : confirmingOff ? (
          <>
            <span className="self-center text-sm text-light-text dark:text-dark-text">Turn off? The link will stop working.</span>
            <button
              onClick={handleDisable}
              disabled={busy}
              className="rounded-lg bg-semantic-danger-500 px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {busy ? 'Turning off…' : 'Turn off'}
            </button>
            <button
              onClick={() => setConfirmingOff(false)}
              disabled={busy}
              className="rounded-lg border border-light-border px-3 py-2 text-sm font-medium text-light-text dark:border-dark-border dark:text-dark-text"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleEnable}
              disabled={busy}
              className="rounded-lg border border-light-border px-3 py-2 text-sm font-medium text-light-text transition hover:border-brand-500 dark:border-dark-border dark:text-dark-text disabled:opacity-60"
            >
              {busy ? 'Working…' : 'Replace link'}
            </button>
            <button
              onClick={() => setConfirmingOff(true)}
              disabled={busy}
              className="rounded-lg border border-light-border px-3 py-2 text-sm font-medium text-light-muted transition hover:border-semantic-danger-300 hover:text-semantic-danger-500 dark:border-dark-border dark:text-dark-muted"
            >
              Turn off
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default StatusPageCard;
