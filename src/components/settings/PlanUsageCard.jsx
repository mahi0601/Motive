import React from 'react';
import { Gauge } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { PLANS, activeClients, nextPlanOf, tierOf } from '../../config/plans';
import { CARD_CLASS } from './cardStyles';

// One meter: a label, "used of limit", and a bar. Only drawn for a finite limit.
const Meter = ({ label, used, limit }) => {
  const full = used >= limit;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-light-text dark:text-dark-text">{label}</span>
        <span className="font-medium text-light-text dark:text-dark-text">{used} of {limit}</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={Math.min(used, limit)}
        className="mt-1 h-2 w-full overflow-hidden rounded-full bg-light-border/60 dark:bg-dark-border"
      >
        <div
          className={`h-full rounded-full ${full ? 'bg-semantic-warning-500' : 'bg-brand-500'}`}
          style={{ width: `${Math.min(100, (used / limit) * 100)}%` }}
        />
      </div>
    </div>
  );
};

// What the account is using of its plan, so a limit is never a surprise: active
// client pages (account-wide) and team members (the workspace you are in, when you
// own it, since the owner's plan sets that limit). A purely informational view of
// limits the server enforces.
const PlanUsageCard = () => {
  const { user } = useAuth();
  const { workspace, workspaces } = useWorkspace();
  if (!user) return null;

  const tier = tierOf(user);
  const plan = PLANS[tier];
  const next = nextPlanOf(tier);
  const clients = activeClients(workspaces, user.id);
  const ownsCurrent = !!workspace && workspace.ownerId === user.id;
  const members = workspace?.members?.length || 0;

  const clientsFull = Number.isFinite(plan.clients) && clients >= plan.clients;
  const membersFull = ownsCurrent && members >= plan.members;
  const atLimit = [];
  if (clientsFull) atLimit.push('active client pages');
  if (membersFull) atLimit.push('team members');

  return (
    <div className={CARD_CLASS}>
      <div className="flex items-center gap-3">
        <Gauge className="text-brand-500" />
        <h4 className="text-lg font-semibold">Plan usage</h4>
      </div>
      <p className="mt-2 text-sm text-light-muted dark:text-dark-muted">You're on {plan.name}.</p>

      <div className="mt-3 space-y-3">
        {Number.isFinite(plan.clients) ? (
          <Meter label="Active client pages" used={clients} limit={plan.clients} />
        ) : (
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-light-text dark:text-dark-text">Active client pages</span>
            <span className="font-medium text-light-text dark:text-dark-text">{clients} (unlimited)</span>
          </div>
        )}
        {ownsCurrent && <Meter label="Team members in this workspace" used={members} limit={plan.members} />}
      </div>

      {atLimit.map((what) => (
        <p
          key={what}
          className="mt-3 text-sm rounded-lg border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 px-3 py-2"
        >
          You're at your plan's limit for {what}.
          {next && ` ${PLANS[next].name} raises it.`}
        </p>
      ))}
      {atLimit.length > 0 && next && (
        <a href="#billing" className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
          See plans
        </a>
      )}
    </div>
  );
};

export default PlanUsageCard;
