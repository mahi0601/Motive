import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { LogoMark } from '../components/ui/Logo';
import { getStatus } from '../services/statusService';
import { accentFor } from '../config/statusAccents';
import { publicMilestones } from '../utils/milestones';
import ClientFeedbackForm from '../components/status/ClientFeedbackForm';
import {
  STATUS,
  getTaskDisplayStatus,
  getStatusLabel,
  getStatusIcon,
  getStatusBadgeClasses,
  getStatusTextClasses,
} from '../utils/statusColors';

const REFRESH_MS = 60 * 1000;

// Most urgent first — what a client most needs to see leads the page.
const SECTION_ORDER = [STATUS.OVERDUE, STATUS.AT_RISK, STATUS.IN_FLIGHT, STATUS.NOT_STARTED, STATUS.SHIPPED];

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : null;

// `accent` is a preset key; its light and dark colours become two CSS variables
// that the page's accented parts read (see config/statusAccents.js).
const Shell = ({ children, accent }) => (
  <div
    data-accent={accent}
    style={{ '--accent-l': accentFor(accent).light, '--accent-d': accentFor(accent).dark }}
    className="min-h-screen bg-light-background px-4 py-10 dark:bg-dark-background"
  >
    <div className="mx-auto w-full max-w-2xl">{children}</div>
  </div>
);

const Footer = () => (
  <p className="mt-10 text-center text-xs text-light-muted dark:text-dark-muted">
    Powered by{' '}
    {/* ?ref=status lets the landing page count visits that came from here. */}
    <Link to="/?ref=status" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
      Clientglass
    </Link>
  </p>
);

// Public and read-only: no account, no app chrome. A client opens a link and
// sees where the work stands. Re-polls every minute so a page left open
// stays current; the link being rotated or turned off shows as "unavailable"
// on the next refresh.
const StatusPage = () => {
  const { token } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  // The owner opens their own link from Settings with ?preview=1 so the look isn't
  // counted as a client viewing. Remembered here, then removed from the address bar
  // so that copying the URL from it gives the plain link, never one that would hide
  // a client's views.
  const [preview] = useState(() => searchParams.get('preview') === '1');
  useEffect(() => {
    if (!searchParams.has('preview')) return;
    const next = new URLSearchParams(searchParams);
    next.delete('preview');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await getStatus(token, { preview });
      setStatus(data.status);
      setUnavailable(false);
      setUpdatedAt(new Date());
    } catch (err) {
      // 404 = unknown, rotated or disabled link. Any other failure (network
      // blip, cold-starting server) keeps whatever we last showed rather than
      // replacing a good page with an error.
      if (err?.response?.status === 404) setUnavailable(true);
    } finally {
      setLoading(false);
    }
  }, [token, preview]);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const sections = useMemo(() => {
    const groups = Object.fromEntries(SECTION_ORDER.map((s) => [s, []]));
    for (const task of status?.tasks || []) groups[getTaskDisplayStatus(task)].push(task);
    return SECTION_ORDER.map((s) => ({ key: s, tasks: groups[s] })).filter((g) => g.tasks.length > 0);
  }, [status]);

  if (loading) {
    return (
      <Shell>
        <Loader2 className="mx-auto mt-24 h-6 w-6 animate-spin text-light-muted dark:text-dark-muted" />
      </Shell>
    );
  }

  if (unavailable || !status) {
    return (
      <Shell>
        <div className="mt-24 text-center">
          <LogoMark size={48} />
          <div className="mt-6 flex items-center justify-center gap-2 text-semantic-danger-700 dark:text-semantic-danger-dark">
            <AlertCircle size={20} />
            <h1 className="font-display text-xl font-bold text-light-text dark:text-white">Status page unavailable</h1>
          </div>
          <p className="mt-3 text-sm text-light-muted dark:text-dark-muted">
            This link is no longer active. Ask the person who shared it for a new one.
          </p>
        </div>
        <Footer />
      </Shell>
    );
  }

  const { workspace, summary } = status;
  // Owner-written details (an older server may not send them at all). All of it
  // is rendered as text by React, never as HTML.
  const page = status.page || {};
  const milestones = publicMilestones(page);
  // On a longer timeline, the first milestone not yet approved is the one coming up.
  const upNextId = milestones.find((m) => !m.approvedAt)?.id;

  return (
    <Shell accent={page.accent}>
      <header className="flex items-center gap-3">
        <span className="text-3xl" aria-hidden="true">{workspace.icon}</span>
        <div>
          <h1 className="font-display text-2xl font-bold text-light-text dark:text-white">{workspace.name}</h1>
          <p className="text-sm text-light-muted dark:text-dark-muted">{page.headline || 'Project status'}</p>
        </div>
      </header>

      {page.summary && (
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-light-text dark:text-dark-text">{page.summary}</p>
      )}

      {milestones.length === 1 && (
        <section
          aria-label="Next milestone"
          className="mt-4 rounded-xl border border-light-border bg-light-surface px-4 py-3 dark:border-dark-border dark:bg-dark-raised"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--accent-l)] dark:text-[color:var(--accent-d)]">
            Next milestone
          </p>
          <p className="mt-0.5 text-sm font-medium text-light-text dark:text-dark-text">
            {milestones[0].title}
            {formatDate(milestones[0].date) && (
              <span className="font-normal text-light-muted dark:text-dark-muted"> · {formatDate(milestones[0].date)}</span>
            )}
          </p>
          {milestones[0].approvedAt && (
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-semantic-success-700 dark:text-semantic-success-dark">
              <CheckCircle2 size={16} aria-hidden="true" />
              Approved on {formatDate(milestones[0].approvedAt)}
            </p>
          )}
        </section>
      )}

      {milestones.length > 1 && (
        <section
          aria-label="Milestones"
          className="mt-4 rounded-xl border border-light-border bg-light-surface px-4 py-3 dark:border-dark-border dark:bg-dark-raised"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--accent-l)] dark:text-[color:var(--accent-d)]">
            Milestones
          </p>
          <ol className="mt-2 space-y-2">
            {milestones.map((m, i) => (
              <li key={m.id || i} className="text-sm">
                <p className="font-medium text-light-text dark:text-dark-text">
                  {m.title}
                  {formatDate(m.date) && (
                    <span className="font-normal text-light-muted dark:text-dark-muted"> · {formatDate(m.date)}</span>
                  )}
                  {m.id === upNextId && !m.approvedAt && (
                    <span className="ml-2 rounded-full bg-light-border/60 px-2 py-0.5 text-xs font-medium text-light-text dark:bg-dark-border dark:text-dark-text">
                      Next
                    </span>
                  )}
                </p>
                {m.approvedAt && (
                  <p className="mt-0.5 flex items-center gap-1.5 font-medium text-semantic-success-700 dark:text-semantic-success-dark">
                    <CheckCircle2 size={16} aria-hidden="true" />
                    Approved on {formatDate(m.approvedAt)}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      <section
        aria-label="Overall progress"
        className="mt-6 rounded-xl border border-light-border bg-light-surface p-5 dark:border-dark-border dark:bg-dark-raised"
      >
        <div className="flex items-baseline justify-between">
          <p className="font-display text-3xl font-bold text-light-text dark:text-white">{summary.percent}%</p>
          <p className="text-sm text-light-muted dark:text-dark-muted">
            {summary.done} of {summary.total} shipped
          </p>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={summary.percent}
          aria-label="Percent of tasks shipped"
          className="mt-3 h-2 overflow-hidden rounded-full bg-light-border dark:bg-dark-border"
        >
          <div className="h-full rounded-full bg-[color:var(--accent-l)] dark:bg-[color:var(--accent-d)]" style={{ width: `${summary.percent}%` }} />
        </div>
      </section>

      {sections.length === 0 && (
        <p className="mt-8 text-center text-sm text-light-muted dark:text-dark-muted">Nothing to show yet.</p>
      )}

      {sections.map(({ key, tasks }) => {
        const Icon = getStatusIcon(key);
        return (
          <section key={key} className="mt-8" aria-label={getStatusLabel(key)}>
            <h2 className={`flex items-center gap-2 text-sm font-semibold ${getStatusTextClasses(key)}`}>
              <Icon size={16} aria-hidden="true" />
              {getStatusLabel(key)}
              <span className="font-normal text-light-muted dark:text-dark-muted">· {tasks.length}</span>
            </h2>
            <ul className="mt-2 divide-y divide-light-border overflow-hidden rounded-xl border border-light-border bg-light-surface dark:divide-dark-border dark:border-dark-border dark:bg-dark-raised">
              {tasks.map((task, i) => {
                const due = formatDate(task.dueDate);
                const done = formatDate(task.completedAt);
                return (
                  <li key={`${task.title}-${i}`} className="flex items-center justify-between gap-4 px-4 py-3">
                    <span className="text-sm text-light-text dark:text-dark-text">{task.title}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      {(key === STATUS.SHIPPED ? done : due) && (
                        <span className="text-xs text-light-muted dark:text-dark-muted">
                          {key === STATUS.SHIPPED ? `Done ${done}` : `Due ${due}`}
                        </span>
                      )}
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeClasses(key)}`}>
                        {getStatusLabel(key)}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {page.allowFeedback && <ClientFeedbackForm token={token} milestones={milestones} />}

      {status.truncated && (
        <p className="mt-4 text-center text-xs text-light-muted dark:text-dark-muted">
          Showing the first {status.tasks.length} tasks.
        </p>
      )}

      {updatedAt && (
        <p className="mt-8 text-center text-xs text-light-muted dark:text-dark-muted">
          Updated {updatedAt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} · refreshes automatically
        </p>
      )}
      {!page.hideBranding && <Footer />}
    </Shell>
  );
};

export default StatusPage;
