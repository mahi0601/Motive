import React, { useCallback, useEffect, useState } from 'react';
import { Check, Inbox, Trash2, X } from 'lucide-react';
import { listRequests, acceptRequest, declineRequest, updateRequest, deleteRequest } from '../../services/workspaceService';
import { logger } from '../../utils/logger';

const formatWhen = (iso) =>
  new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const STATE_LABEL = { received: 'New', accepted: 'On your board', declined: 'Declined' };
const SCOPE_LABEL = { in_scope: 'In scope', extra: 'Extra work' };
const btn = 'inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs';
const quiet = `${btn} border-light-border text-light-text dark:border-dark-border dark:text-dark-text`;

// The owner's inbox for what clients asked for from the public status page. Accepting one
// puts it on the board as a to-do task; the client then sees it follow that task. Names are
// whatever the sender typed, so the list says they are not verified.
const ClientRequestInbox = ({ workspaceId }) => {
  const [items, setItems] = useState(null);
  const [unread, setUnread] = useState(0);
  // This month's allowance and what is used of it (null when none is set).
  const [allowance, setAllowance] = useState(null);
  const [error, setError] = useState('');
  // Which row is being declined, and the note typed so far.
  const [declining, setDeclining] = useState(null);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await listRequests(workspaceId);
      setItems(data.items);
      setUnread(data.unread);
      setAllowance(data.allowance ?? null);
      setError('');
    } catch (err) {
      logger.warn('Could not load client requests', { status: err?.response?.status });
      setError('Could not load client requests.');
    }
  }, [workspaceId]);

  useEffect(() => {
    load();
  }, [load]);

  // The counts come from the server (a request's scope and month decide them), so after a
  // change that moves them the numbers are fetched again rather than worked out here.
  const refreshAllowance = async () => {
    if (!allowance) return;
    try {
      const { data } = await listRequests(workspaceId);
      setAllowance(data.allowance ?? null);
    } catch {
      // The list is still right; the count catches up on the next load.
    }
  };

  const patch = (id, change) => setItems((list) => list.map((r) => (r.id === id ? { ...r, ...change } : r)));
  const fail = (what) => (err) => {
    logger.warn(`Could not ${what} a client request`, { status: err?.response?.status });
    setError(err?.response?.status === 409 ? 'That request was already decided. Reloaded.' : `Could not ${what} that request.`);
    if (err?.response?.status === 409) load();
  };
  const seen = (item) => {
    if (!item.readAt) setUnread((n) => Math.max(0, n - 1));
  };

  const accept = async (item, scope) => {
    try {
      const { data } = await acceptRequest(workspaceId, item.id, { scope });
      patch(item.id, { state: 'accepted', scope, readAt: item.readAt || new Date().toISOString(), task: { id: data.task?.id, status: 'todo' } });
      seen(item);
      setError('');
      refreshAllowance();
    } catch (err) {
      fail('accept')(err);
    }
  };

  const decline = async (item) => {
    try {
      await declineRequest(workspaceId, item.id, note.trim() ? { note: note.trim() } : {});
      patch(item.id, { state: 'declined', declineNote: note.trim() || null, readAt: item.readAt || new Date().toISOString() });
      seen(item);
      setDeclining(null);
      setNote('');
      setError('');
    } catch (err) {
      fail('decline')(err);
    }
  };

  const retag = async (item, scope) => {
    try {
      await updateRequest(workspaceId, item.id, { scope });
      patch(item.id, { scope });
      refreshAllowance();
    } catch (err) {
      fail('update')(err);
    }
  };

  const markRead = async (item) => {
    try {
      await updateRequest(workspaceId, item.id, { read: true });
      patch(item.id, { readAt: new Date().toISOString() });
      seen(item);
    } catch (err) {
      fail('update')(err);
    }
  };

  const remove = async (item) => {
    try {
      await deleteRequest(workspaceId, item.id);
      setItems((list) => list.filter((r) => r.id !== item.id));
      seen(item);
      refreshAllowance();
    } catch (err) {
      fail('delete')(err);
    }
  };

  return (
    <div className="mt-5 border-t border-light-border pt-5 dark:border-dark-border">
      <div className="flex items-center justify-between gap-3">
        <h5 className="flex items-center gap-2 font-semibold text-light-text dark:text-dark-text">
          <Inbox size={16} className="text-brand-500" aria-hidden="true" /> Client requests
        </h5>
        {items && <span className="text-sm text-light-muted dark:text-dark-muted">{unread} unread</span>}
      </div>
      <p className="mt-1 text-xs text-light-muted dark:text-dark-muted">
        Names are typed by the sender and not verified. Accepting a request adds a task to your board; your client sees its title and progress, never who sent it.
      </p>

      {allowance && (
        <div className="mt-3 rounded-lg border border-light-border p-3 text-sm dark:border-dark-border">
          <p className="text-light-text dark:text-dark-text">
            <strong>This month:</strong> {allowance.used} of {allowance.limit} included used
            {allowance.extra > 0 && `, ${allowance.extra} extra work`}
          </p>
          {allowance.used >= allowance.limit && (
            <p className="mt-1 text-xs text-light-muted dark:text-dark-muted">
              You have used the whole allowance. You can still accept more: tag them “extra work” if you will charge for them, and your client sees the difference.
            </p>
          )}
        </div>
      )}

      {error && <p role="alert" className="mt-2 text-sm text-semantic-danger-700 dark:text-semantic-danger-dark">{error}</p>}

      {items && items.length === 0 && !error && (
        <p className="mt-3 text-sm text-light-muted dark:text-dark-muted">Nothing yet. Requests from your client’s page will appear here.</p>
      )}

      {items && items.length > 0 && (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              aria-label={item.title}
              className={`rounded-lg border p-3 text-sm ${
                item.readAt ? 'border-light-border dark:border-dark-border' : 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-light-text dark:text-dark-text">
                  <strong>{item.title}</strong>
                  <span className="text-light-muted dark:text-dark-muted"> · {item.authorName} · {STATE_LABEL[item.state] || item.state}</span>
                  {item.scope && <span className="text-light-muted dark:text-dark-muted"> · {SCOPE_LABEL[item.scope]}</span>}
                </p>
                <span className="text-xs text-light-muted dark:text-dark-muted">{formatWhen(item.createdAt)}</span>
              </div>
              {item.details && <p className="mt-1 whitespace-pre-line text-light-text dark:text-dark-text">{item.details}</p>}
              {item.declineNote && <p className="mt-1 text-light-muted dark:text-dark-muted">Your note: {item.declineNote}</p>}

              <div className="mt-2 flex flex-wrap gap-2">
                {item.state === 'received' && declining !== item.id && (
                  <>
                    <button type="button" className={quiet} onClick={() => accept(item, 'in_scope')} aria-label={`Accept ${item.title} as in scope`}>
                      <Check size={12} aria-hidden="true" /> Accept, in scope
                    </button>
                    <button type="button" className={quiet} onClick={() => accept(item, 'extra')} aria-label={`Accept ${item.title} as extra work`}>
                      <Check size={12} aria-hidden="true" /> Accept, extra work
                    </button>
                    <button type="button" className={quiet} onClick={() => setDeclining(item.id)} aria-label={`Decline ${item.title}`}>
                      <X size={12} aria-hidden="true" /> Decline
                    </button>
                  </>
                )}
                {item.state === 'accepted' && (
                  <button
                    type="button"
                    className={quiet}
                    onClick={() => retag(item, item.scope === 'extra' ? 'in_scope' : 'extra')}
                    aria-label={`Mark ${item.title} as ${item.scope === 'extra' ? 'in scope' : 'extra work'}`}
                  >
                    Mark as {item.scope === 'extra' ? 'in scope' : 'extra work'}
                  </button>
                )}
                {!item.readAt && (
                  <button type="button" className={quiet} onClick={() => markRead(item)} aria-label={`Mark ${item.title} as read`}>
                    <Check size={12} aria-hidden="true" /> Mark read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(item)}
                  aria-label={`Delete ${item.title}`}
                  className={`${btn} border-light-border text-light-muted dark:border-dark-border dark:text-dark-muted`}
                >
                  <Trash2 size={12} aria-hidden="true" /> Delete
                </button>
              </div>

              {declining === item.id && (
                <div className="mt-2 space-y-2">
                  <label className="block text-xs text-light-muted dark:text-dark-muted">
                    Note for your client (optional, shown on their page)
                    <textarea
                      rows={2}
                      maxLength={300}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-light-border bg-light-surface px-3 py-2 text-sm text-light-text dark:border-dark-border dark:bg-dark-raised dark:text-dark-text"
                    />
                  </label>
                  <div className="flex gap-2">
                    <button type="button" className={quiet} onClick={() => decline(item)}>Confirm decline</button>
                    <button type="button" className={quiet} onClick={() => { setDeclining(null); setNote(''); }}>Cancel</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ClientRequestInbox;
