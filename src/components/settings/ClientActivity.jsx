import React, { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { getEngagement } from '../../services/workspaceService';
import { timeAgo } from '../../utils/timeAgo';

// When the client status page was last opened and how many visits it had this week, so the owner
// can see their client is looking (or that the link still needs sending). A visit is a distinct
// visitor on a day, not a reload. The owner's own preview and link previews are not counted.
// It is a nicety, not a control, so it stays out of the way until it has something to say and
// stays hidden if it cannot be loaded.
const ClientActivity = ({ workspaceId }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    let current = true; // ignore an answer that arrives after the workspace changed
    setData(null);
    getEngagement(workspaceId)
      .then(({ data: d }) => {
        if (current) setData(d);
      })
      .catch(() => {});
    return () => {
      current = false;
    };
  }, [workspaceId]);

  if (!data) return null;
  const { lastViewedAt, visits7d } = data;
  const when = timeAgo(lastViewedAt);

  return (
    <section aria-label="Client activity" className="mt-4 rounded-lg border border-light-border px-3 py-2.5 text-sm dark:border-dark-border">
      <p className="flex items-center gap-2 font-medium text-light-text dark:text-dark-text">
        <Eye size={16} aria-hidden="true" className="text-brand-500" />
        {lastViewedAt ? `Last opened ${when}` : 'Not opened yet'}
      </p>
      {lastViewedAt ? (
        <p className="mt-0.5 text-light-muted dark:text-dark-muted">
          {visits7d > 0 ? `${visits7d} ${visits7d === 1 ? 'visit' : 'visits'} in the last 7 days` : 'No visits in the last 7 days'}
        </p>
      ) : (
        <p className="mt-0.5 text-light-muted dark:text-dark-muted">Send your client the link and you will see here when they open it.</p>
      )}
      <p className="mt-1 text-xs text-light-muted dark:text-dark-muted">Your own preview and link previews are not counted.</p>
    </section>
  );
};

export default ClientActivity;
