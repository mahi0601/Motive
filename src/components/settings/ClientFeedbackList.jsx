import React, { useCallback, useEffect, useState } from 'react';
import { Check, MessageSquare, Trash2 } from 'lucide-react';
import { listFeedback, markFeedbackRead, deleteFeedback } from '../../services/workspaceService';
import { logger } from '../../utils/logger';

const KIND_LABEL = { approve: 'Approved', changes: 'Requested changes', comment: 'Commented' };
const formatWhen = (iso) =>
  new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

// The owner's inbox for what clients sent from the public status page. Names
// are whatever the sender typed, so the list says they are not verified.
const ClientFeedbackList = ({ workspaceId }) => {
  const [items, setItems] = useState(null);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await listFeedback(workspaceId);
      setItems(data.items);
      setUnread(data.unread);
      setError('');
    } catch (err) {
      logger.warn('Could not load client feedback', { status: err?.response?.status });
      setError('Could not load client feedback.');
    }
  }, [workspaceId]);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (item) => {
    try {
      await markFeedbackRead(workspaceId, item.id);
      setItems((list) => list.map((f) => (f.id === item.id ? { ...f, readAt: new Date().toISOString() } : f)));
      if (!item.readAt) setUnread((n) => Math.max(0, n - 1));
    } catch (err) {
      logger.warn('Could not mark feedback read', { status: err?.response?.status });
      setError('Could not update that item.');
    }
  };

  const remove = async (item) => {
    try {
      await deleteFeedback(workspaceId, item.id);
      setItems((list) => list.filter((f) => f.id !== item.id));
      if (!item.readAt) setUnread((n) => Math.max(0, n - 1));
    } catch (err) {
      logger.warn('Could not delete feedback', { status: err?.response?.status });
      setError('Could not delete that item.');
    }
  };

  return (
    <div className="mt-5 border-t border-light-border pt-5 dark:border-dark-border">
      <div className="flex items-center justify-between gap-3">
        <h5 className="flex items-center gap-2 font-semibold text-light-text dark:text-dark-text">
          <MessageSquare size={16} className="text-brand-500" aria-hidden="true" /> Client feedback
        </h5>
        {items && <span className="text-sm text-light-muted dark:text-dark-muted">{unread} unread</span>}
      </div>
      <p className="mt-1 text-xs text-light-muted dark:text-dark-muted">
        Names are typed by the sender and not verified.
      </p>

      {error && (
        <p role="alert" className="mt-2 text-sm text-semantic-danger-700 dark:text-semantic-danger-dark">{error}</p>
      )}

      {items && items.length === 0 && !error && (
        <p className="mt-3 text-sm text-light-muted dark:text-dark-muted">
          Nothing yet. Responses from your client’s page will appear here.
        </p>
      )}

      {items && items.length > 0 && (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              aria-label={item.authorName}
              className={`rounded-lg border p-3 text-sm ${
                item.readAt ? 'border-light-border dark:border-dark-border' : 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-light-text dark:text-dark-text">
                  <strong>{item.authorName}</strong> <span className="text-light-muted dark:text-dark-muted">· {KIND_LABEL[item.kind] || item.kind}</span>
                  {item.milestoneTitle && <span className="text-light-muted dark:text-dark-muted"> on “{item.milestoneTitle}”</span>}
                </p>
                <span className="text-xs text-light-muted dark:text-dark-muted">{formatWhen(item.createdAt)}</span>
              </div>
              {item.message && <p className="mt-1 whitespace-pre-line text-light-text dark:text-dark-text">{item.message}</p>}
              <div className="mt-2 flex gap-2">
                {!item.readAt && (
                  <button
                    type="button"
                    onClick={() => markRead(item)}
                    aria-label={`Mark ${item.authorName}’s feedback as read`}
                    className="inline-flex items-center gap-1 rounded-lg border border-light-border px-2 py-1 text-xs text-light-text dark:border-dark-border dark:text-dark-text"
                  >
                    <Check size={12} aria-hidden="true" /> Mark read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(item)}
                  aria-label={`Delete ${item.authorName}’s feedback`}
                  className="inline-flex items-center gap-1 rounded-lg border border-light-border px-2 py-1 text-xs text-light-muted dark:border-dark-border dark:text-dark-muted"
                >
                  <Trash2 size={12} aria-hidden="true" /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ClientFeedbackList;
