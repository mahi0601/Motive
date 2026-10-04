import React from 'react';

// Where each request stands, in words (never colour alone). The server works the state out
// from the task the owner made, so it moves when the task moves.
const STATE = {
  received: 'Received',
  planned: 'Planned',
  in_progress: 'In progress',
  done: 'Done',
  declined: 'Not taken on',
  closed: 'Closed',
};

const formatDay = (iso) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

const formatReset = (iso) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });

// How much of this month's allowance is used, in words first (the bar is a picture of the
// same numbers). Over the allowance is said plainly, not hidden.
export const AllowanceSummary = ({ allowance }) => {
  const { limit, used, extra, resetsOn } = allowance;
  const over = used > limit;
  return (
    <div className="mt-3 rounded-xl border border-light-border bg-light-surface px-4 py-3 text-sm dark:border-dark-border dark:bg-dark-raised">
      <p className="font-medium text-light-text dark:text-dark-text">
        {used} of {limit} included {limit === 1 ? 'request' : 'requests'} used this month
        {over && ' (over the included amount)'}
      </p>
      <div aria-hidden="true" className="mt-2 h-2 overflow-hidden rounded-full bg-light-border dark:bg-dark-border">
        <div className="h-full rounded-full bg-[color:var(--accent-l)] dark:bg-[color:var(--accent-d)]" style={{ width: `${Math.min(100, Math.round((used / limit) * 100))}%` }} />
      </div>
      <p className="mt-2 text-xs text-light-muted dark:text-dark-muted">
        {extra > 0 ? `${extra} extra work ${extra === 1 ? 'request' : 'requests'} this month, not counted above. ` : ''}
        Resets {formatReset(resetsOn)}.
      </p>
    </div>
  );
};

// What clients have asked for and what happened to it. Titles, a state, an optional
// "Extra work" tag and the owner's note on a declined one; never who sent it. The
// allowance, when the owner set one, shows even before the first request.
const ClientRequestList = ({ requests, allowance = null }) => {
  if (!requests.length && !allowance) return null;
  return (
    <section aria-label="Your requests" className="mt-8">
      <h2 className="font-display text-lg font-semibold text-light-text dark:text-white">Your requests</h2>
      {allowance && <AllowanceSummary allowance={allowance} />}
      {requests.length > 0 && (
        <ul className="mt-3 divide-y divide-light-border rounded-xl border border-light-border bg-light-surface dark:divide-dark-border dark:border-dark-border dark:bg-dark-raised">
          {requests.map((r) => (
            <li key={r.ref} className="px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-light-text dark:text-dark-text">{r.title}</span>
                <span className="flex items-center gap-2">
                  {r.scope === 'extra' && (
                    <span className="rounded-full border border-light-border px-2 py-0.5 text-xs text-light-muted dark:border-dark-border dark:text-dark-muted">Extra work</span>
                )}
                <span className="rounded-full bg-light-border/60 px-2 py-0.5 text-xs font-medium text-light-text dark:bg-dark-border/60 dark:text-dark-text">{STATE[r.state] || r.state}</span>
              </span>
            </div>
            <p className="mt-0.5 text-xs text-light-muted dark:text-dark-muted">Sent {formatDay(r.createdAt)}</p>
            {r.declineNote && <p className="mt-1 whitespace-pre-line text-light-text dark:text-dark-text">{r.declineNote}</p>}
          </li>
        ))}
      </ul>
      )}
    </section>
  );
};

export default ClientRequestList;
