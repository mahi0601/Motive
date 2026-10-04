import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Eye, RefreshCw, Users } from 'lucide-react';
import { getClientsOverview } from '../services/workspaceService';
import { useWorkspace } from '../context/WorkspaceContext';
import { timeAgo } from '../utils/timeAgo';

// Why a client needs a look, in words (never colour alone). The server decides which apply and
// in what order; this only says them.
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const REASON = {
  overdue: (c) => `${plural(c.overdue, 'task', 'tasks')} overdue`,
  responses: (c) => plural(c.unreadResponses, 'unread reply', 'unread replies'),
  requests: (c) => plural(c.unreadRequests, 'new request', 'new requests'),
  not_opened: () => 'Link is live but has not been opened yet',
  quiet: () => 'Not opened in over 2 weeks',
};

const milestoneDate = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' }) : '');

// Every client the owner runs, most in need of attention first, so a Monday morning starts
// with "who needs me" instead of opening each workspace in turn. Numbers and dates only.
const Clients = () => {
  const { switchWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [clients, setClients] = useState(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const mounted = useRef(true);

  const load = useCallback(async (initial) => {
    if (initial) setClients(null);
    setFailed(false);
    setRefreshing(!initial);
    try {
      const { data } = await getClientsOverview();
      if (mounted.current) setClients(data.clients || []);
    } catch {
      if (mounted.current) setFailed(true);
    } finally {
      if (mounted.current) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    load(true);
    return () => {
      mounted.current = false;
    };
  }, [load]);

  const open = (id) => {
    switchWorkspace(id);
    navigate('/dashboard');
  };

  const needing = clients ? clients.filter((c) => c.attention.length > 0).length : 0;

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-3 font-display text-display font-semibold text-light-text dark:text-dark-text">
          <Users className="text-brand-500" aria-hidden="true" /> Clients
        </h1>
        <button
          type="button"
          onClick={() => load(false)}
          disabled={refreshing || clients === null}
          aria-label="Refresh"
          className="inline-flex items-center gap-1.5 rounded-lg border border-light-border px-3 py-2 text-sm font-medium text-light-text transition hover:bg-light-border/40 disabled:opacity-50 dark:border-dark-border dark:text-dark-text dark:hover:bg-dark-raised"
        >
          <RefreshCw size={16} aria-hidden="true" className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </header>

      {clients === null && !failed && (
        <p role="status" className="text-sm text-light-muted dark:text-dark-muted">Loading your clients…</p>
      )}

      {failed && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-semantic-danger-200 bg-semantic-danger-50 px-4 py-3 text-sm text-semantic-danger-700 dark:border-semantic-danger-500/30 dark:bg-semantic-danger-500/10 dark:text-semantic-danger-dark">
          <AlertCircle size={16} aria-hidden="true" /> Could not load your clients.
          <button type="button" onClick={() => load(true)} className="font-medium underline">Try again</button>
        </div>
      )}

      {clients && clients.length === 0 && (
        <div className="rounded-xl border border-light-border p-6 text-sm dark:border-dark-border">
          <p className="font-medium text-light-text dark:text-dark-text">You have no clients yet.</p>
          <p className="mt-1 text-light-muted dark:text-dark-muted">A client is a workspace you own. Create one in Settings and it will show up here.</p>
          <Link to="/settings" className="mt-3 inline-flex items-center gap-1 font-medium text-brand-600 hover:underline dark:text-brand-400">
            Go to Settings <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      )}

      {clients && clients.length > 0 && (
        <>
          <p className="mb-3 text-sm text-light-muted dark:text-dark-muted">
            {needing === 0
              ? 'No client needs attention right now.'
              : `${needing} of ${clients.length} ${clients.length === 1 ? 'client needs' : 'clients need'} attention, most urgent first.`}
          </p>
          <ul aria-label="Clients" className="space-y-3">
            {clients.map((c) => {
              const lastOpened = c.lastViewedAt ? `Last opened ${timeAgo(c.lastViewedAt)}` : c.linkLive ? 'Not opened yet' : '';
              const milestone = c.nextMilestone ? `Next milestone: ${c.nextMilestone.title}${c.nextMilestone.date ? ` · ${milestoneDate(c.nextMilestone.date)}` : ''}` : '';
              return (
                <li key={c.id} className="rounded-xl border border-light-border bg-light-surface p-4 dark:border-dark-border dark:bg-dark-raised">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span aria-hidden="true" className="text-xl">{c.icon}</span>
                        <h2 className="font-display text-lg font-semibold text-light-text dark:text-dark-text">{c.name}</h2>
                        <span className="inline-flex items-center gap-1 rounded-full border border-light-border px-2 py-0.5 text-xs font-medium text-light-text dark:border-dark-border dark:text-dark-text">
                          {c.linkLive && <Eye size={12} aria-hidden="true" />}
                          {c.linkLive ? 'Live link' : 'No link yet'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-light-muted dark:text-dark-muted">
                        {[lastOpened, `${c.open} open`, `${c.shippedThisWeek} shipped this week`].filter(Boolean).join(' · ')}
                      </p>
                      {milestone && <p className="text-sm text-light-muted dark:text-dark-muted">{milestone}</p>}
                      {c.attention.length > 0 && (
                        <p className="mt-1 text-sm font-medium text-light-text dark:text-dark-text">
                          Needs attention: {c.attention.map((a) => REASON[a](c)).join(' · ')}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => open(c.id)}
                      aria-label={`Open ${c.name}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-brand-600 px-3 py-2 text-sm font-medium text-brand-600 transition hover:bg-brand-600 hover:text-white dark:border-white dark:text-white"
                    >
                      Open <ArrowRight size={14} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          {clients.length === 1 && (
            <p className="mt-3 text-sm text-light-muted dark:text-dark-muted">You have only one client so far. Add more from Settings to compare them here.</p>
          )}
        </>
      )}
    </div>
  );
};

export default Clients;
