import React, { useEffect, useState } from 'react';
import { Copy, Crown, LogOut as LeaveIcon, Plus, RefreshCw, Users, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  createInvite, listInvites, resendInvite, revokeInvite,
  updateMemberRole, removeMember, transferOwnership, leaveWorkspace, createWorkspace,
} from '../../services/workspaceService';
import { PLANS, memberLimit, tierOf } from '../../config/plans';
import { logger } from '../../utils/logger';
import { CARD_CLASS } from './cardStyles';
import DuplicateWorkspaceModal from './DuplicateWorkspaceModal';

// Members — invite lifecycle, role changes, leaving, and creating a workspace.
const MembersCard = () => {
  const { user } = useAuth();
  const { workspace, loadWorkspace, switchWorkspace } = useWorkspace();

  // Invite a teammate into the workspace — this is the only way another real
  // person ever becomes @mentionable (there's no other sharing mechanism).
  // Unlike the old inviteMember, the invitee no longer needs an existing
  // account — see workspace.service.js#createInvite.
  const isOwner = !!workspace && workspace.ownerId === user?.id;
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [inviteStatus, setInviteStatus] = useState(null); // { type: 'success'|'error', message }
  const [inviting, setInviting] = useState(false);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [invitesLoading, setInvitesLoading] = useState(false);

  // Team size per workspace follows the plan (Free 2, Studio 5, Agency 15). Purely
  // a UI hint: the backend enforces it when the invite is sent and again when it
  // is accepted.
  const tier = tierOf(user);
  const seatLimit = memberLimit(tier);
  const atMemberCap = (workspace?.members?.length || 0) >= seatLimit;
  const nextPlan = tier === 'free' ? PLANS.studio : tier === 'studio' ? PLANS.agency : null;

  // Pending invites only matter to someone who can act on them.
  useEffect(() => {
    if (!isOwner || !workspace?.id) { setPendingInvites([]); return; }
    let active = true;
    setInvitesLoading(true);
    listInvites(workspace.id)
      .then(({ data }) => { if (active) setPendingInvites(data.invites); })
      .catch((e) => logger.warn('Failed to load pending invites', { error: e.message }))
      .finally(() => { if (active) setInvitesLoading(false); });
    return () => { active = false; };
  }, [isOwner, workspace?.id]);
  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || atMemberCap) return;
    if (!workspace?.id) {
      // Workspace loads async on app start; this only happens if the user
      // clicks Invite in that brief window. Silently no-op'ing here (the
      // original bug) looked identical to a successful invite that just
      // didn't do anything.
      setInviteStatus({ type: 'error', message: 'Still loading your workspace — try again in a moment.' });
      return;
    }
    setInviting(true);
    setInviteStatus(null);
    try {
      const { data } = await createInvite(workspace.id, inviteEmail.trim(), inviteRole);
      setInviteStatus({ type: 'success', message: `Invited ${inviteEmail.trim()} — they'll get an email to join.` });
      setInviteEmail('');
      setPendingInvites((prev) => [data.invite, ...prev.filter((i) => i.email !== data.invite.email)]);
    } catch (err) {
      setInviteStatus({ type: 'error', message: err?.response?.data?.message || 'Could not invite that user.' });
    } finally {
      setInviting(false);
    }
  };

  const handleResendInvite = async (inviteId) => {
    try {
      await resendInvite(workspace.id, inviteId);
      setInviteStatus({ type: 'success', message: 'Invite resent.' });
    } catch (err) {
      setInviteStatus({ type: 'error', message: err?.response?.data?.message || 'Could not resend that invite.' });
    }
  };

  const handleRevokeInvite = async (inviteId) => {
    try {
      await revokeInvite(workspace.id, inviteId);
      setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));
    } catch (err) {
      setInviteStatus({ type: 'error', message: err?.response?.data?.message || 'Could not revoke that invite.' });
    }
  };

  const handleRoleChange = async (memberUserId, role) => {
    try {
      await updateMemberRole(workspace.id, memberUserId, role);
      loadWorkspace();
    } catch (err) {
      setInviteStatus({ type: 'error', message: err?.response?.data?.message || "Could not change that member's role." });
    }
  };

  // A single pending-action slot for the two high-stakes per-member actions
  // (remove, transfer ownership) — clicking either shows an inline
  // "are you sure" in that row instead of acting immediately, matching the
  // Danger Zone's own commit-then-confirm bar below rather than Dashboard's
  // optimistic-undo pattern, which doesn't map cleanly onto a persisted
  // member list. Only one row can be mid-confirm at a time.
  const [pendingMemberAction, setPendingMemberAction] = useState(null); // { type: 'remove'|'transfer', userId, name }

  const handleRemoveMember = async (memberUserId) => {
    setPendingMemberAction(null);
    try {
      await removeMember(workspace.id, memberUserId);
      loadWorkspace();
    } catch (err) {
      setInviteStatus({ type: 'error', message: err?.response?.data?.message || 'Could not remove that member.' });
    }
  };

  const handleTransferOwnership = async (memberUserId) => {
    setPendingMemberAction(null);
    try {
      await transferOwnership(workspace.id, memberUserId);
      loadWorkspace(); // isOwner re-derives from workspace.ownerId === user.id
    } catch (err) {
      setInviteStatus({ type: 'error', message: err?.response?.data?.message || 'Could not transfer ownership.' });
    }
  };

  const [leaving, setLeaving] = useState(false);
  const handleLeaveWorkspace = async () => {
    setLeaving(true);
    try {
      await leaveWorkspace(workspace.id);
      loadWorkspace();
    } catch (err) {
      setInviteStatus({ type: 'error', message: err?.response?.data?.message || 'Could not leave that workspace.' });
      setLeaving(false);
    }
  };

  // "+ New workspace" — createWorkspace has existed on the backend (and even
  // in this file's own service import) with no UI entry point at all; this
  // is the only one. Same inline-reveal weight as Dashboard's per-column
  // quick-add, not a full modal.
  // "New client from this one" (owner only): copies this workspace's structure.
  const [duplicating, setDuplicating] = useState(false);
  const handleDuplicated = async ({ workspace: created, counts }) => {
    await loadWorkspace();
    switchWorkspace(created.id);
    setDuplicating(false);
    const part = (n, one, many) => `${n} ${n === 1 ? one : many}`;
    setInviteStatus({
      type: 'success',
      message: `Created “${created.name}” from this one: ${part(counts.tasks ?? 0, 'task', 'tasks')}, ${part(counts.pages ?? 0, 'page', 'pages')}, ${part(counts.milestones ?? 0, 'milestone', 'milestones')}.`,
    });
  };
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [creatingWorkspaceBusy, setCreatingWorkspaceBusy] = useState(false);
  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    setCreatingWorkspaceBusy(true);
    try {
      const { data } = await createWorkspace({ name: newWorkspaceName.trim() });
      await loadWorkspace();
      switchWorkspace(data.workspace.id);
      setNewWorkspaceName('');
      setCreatingWorkspace(false);
    } catch (err) {
      setInviteStatus({ type: 'error', message: err?.response?.data?.message || 'Could not create that workspace.' });
    } finally {
      setCreatingWorkspaceBusy(false);
    }
  };

  const daysAgo = (iso) => {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
    return days <= 0 ? 'today' : days === 1 ? '1 day ago' : `${days} days ago`;
  };

  return (
    <div className={CARD_CLASS}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          <Users className="text-brand-500" />
          <h4 className="text-lg font-semibold">Members</h4>
        </div>
        {/* createWorkspace has existed on the backend (and even in
            this file's own service import) with no UI entry point at
            all — this is the only one. */}
        {isOwner && !creatingWorkspace && (
          <button
            onClick={() => setDuplicating(true)}
            className="flex items-center gap-1 text-xs font-medium text-light-muted transition hover:text-brand-600 dark:text-dark-muted dark:hover:text-brand-400"
          >
            <Copy className="h-3.5 w-3.5" /> New client from this one
          </button>
        )}
        {!creatingWorkspace && (
          <button
            onClick={() => setCreatingWorkspace(true)}
            className="flex items-center gap-1 text-xs font-medium text-light-muted transition hover:text-brand-600 dark:text-dark-muted dark:hover:text-brand-400"
          >
            <Plus className="h-3.5 w-3.5" /> New workspace
          </button>
        )}
      </div>
      {creatingWorkspace && (
        <form onSubmit={handleCreateWorkspace} className="mb-3 flex flex-wrap gap-2">
          <input
            type="text"
            autoFocus
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            placeholder="Workspace name"
            className="min-w-0 flex-1 px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-raised"
          />
          <button
            type="submit"
            disabled={creatingWorkspaceBusy}
            className="px-3 py-2 text-sm rounded-lg font-medium bg-brand-600 text-white shadow-sm hover:bg-brand-700 disabled:opacity-60"
          >
            {creatingWorkspaceBusy ? 'Creating…' : 'Create'}
          </button>
          <button
            type="button"
            onClick={() => { setCreatingWorkspace(false); setNewWorkspaceName(''); }}
            disabled={creatingWorkspaceBusy}
            className="px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border text-light-text dark:text-dark-text"
          >
            Cancel
          </button>
        </form>
      )}
      <p className="text-sm text-light-muted dark:text-dark-muted mb-3">
        Invite a teammate by email — they'll get a link to join, whether or not they have a Clientglass account yet.
      </p>

      {isOwner && (
        atMemberCap ? (
          <p className="text-sm rounded-lg border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 px-3 py-2">
            {PLANS[tier].name} workspaces are limited to {seatLimit} members{nextPlan ? ` — upgrade to Clientglass ${nextPlan.name} below to invite more.` : '.'}
          </p>
        ) : (
          <form onSubmit={handleInvite} className="flex flex-wrap gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="teammate@example.com"
              className="min-w-0 flex-1 px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-raised"
            />
            <select
              aria-label="Role for the new invitation"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="px-2 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-raised"
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              type="submit"
              disabled={inviting}
              className="px-4 py-2 text-sm rounded-lg font-medium bg-brand-600 text-white shadow-sm hover:bg-brand-700 hover:shadow-md transition-all disabled:opacity-60"
            >
              {inviting ? 'Inviting…' : 'Invite'}
            </button>
          </form>
        )
      )}
      {inviteStatus && (
        <p className={`text-sm mt-2 ${inviteStatus.type === 'error' ? 'text-semantic-danger-700 dark:text-semantic-danger-dark' : 'text-semantic-success-700 dark:text-semantic-success-dark'}`}>
          {inviteStatus.message}
        </p>
      )}

      {workspace?.members?.length > 0 && (
        <div className="mt-4 divide-y divide-light-border dark:divide-dark-border">
          {workspace.members.map((m) => {
            const isPendingRemove = pendingMemberAction?.type === 'remove' && pendingMemberAction.userId === m.userId;
            const isPendingTransfer = pendingMemberAction?.type === 'transfer' && pendingMemberAction.userId === m.userId;
            if (isPendingRemove || isPendingTransfer) {
              return (
                <div key={m.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="text-sm text-light-text dark:text-dark-text">
                    {isPendingRemove ? `Remove ${m.user?.name}?` : `Make ${m.user?.name} the owner?`}
                  </span>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => (isPendingRemove ? handleRemoveMember(m.userId) : handleTransferOwnership(m.userId))}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold text-white transition ${
                        isPendingRemove ? 'bg-semantic-danger-500 hover:opacity-90' : 'bg-brand-600 hover:bg-brand-700'
                      }`}
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setPendingMemberAction(null)}
                      className="rounded-lg border border-light-border px-3 py-1 text-xs font-medium text-light-text dark:border-dark-border dark:text-dark-text"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            }
            return (
              <div key={m.id} className="flex items-center gap-3 py-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                  {(m.user?.name || '?').charAt(0).toUpperCase()}
                </span>
                <span className="flex-1 truncate text-sm text-light-text dark:text-dark-text">
                  {m.user?.name} {m.userId === user?.id ? '(you)' : ''}
                </span>
                {m.role === 'owner' ? (
                  <span className="rounded-lg bg-brand-soft px-2 py-1 text-xs font-semibold text-brand-700 dark:text-brand-300">Owner</span>
                ) : isOwner ? (
                  <>
                    <select
                      aria-label={`Role for ${m.user?.name || 'member'}`}
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.userId, e.target.value)}
                      className="rounded-lg border border-light-border bg-light-surface px-2 py-1 text-xs dark:border-dark-border dark:bg-dark-raised"
                    >
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button
                      onClick={() => setPendingMemberAction({ type: 'transfer', userId: m.userId })}
                      className="rounded-lg p-1.5 text-light-muted transition hover:text-brand-600 dark:text-dark-muted"
                      aria-label={`Make ${m.user?.name} the owner`}
                      title="Make owner"
                    >
                      <Crown className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setPendingMemberAction({ type: 'remove', userId: m.userId })}
                      className="rounded-lg p-1.5 text-light-muted transition hover:text-semantic-danger-700 dark:text-dark-muted"
                      aria-label={`Remove ${m.user?.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <span className="text-xs capitalize text-light-muted dark:text-dark-muted">{m.role}</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Self-service — today, a non-owner had zero actions on their
          own row at all. removeMember is owner-acting-on-someone-else
          (assertOwner-gated); this calls the distinct leaveWorkspace
          function instead, since it's a different authorization shape. */}
      {!isOwner && workspace && (
        <button
          onClick={handleLeaveWorkspace}
          disabled={leaving}
          className="mt-4 flex items-center gap-1.5 text-xs font-medium text-light-muted transition hover:text-semantic-danger-700 dark:text-dark-muted disabled:opacity-60"
        >
          <LeaveIcon className="h-3.5 w-3.5" /> {leaving ? 'Leaving…' : 'Leave workspace'}
        </button>
      )}

      {isOwner && !invitesLoading && pendingInvites.length > 0 && (
        <div className="mt-4 border-t border-light-border pt-3 dark:border-dark-border">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-light-muted dark:text-dark-muted">Pending invites</p>
          <div className="divide-y divide-light-border dark:divide-dark-border">
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 py-2">
                <span className="flex-1 truncate text-sm text-light-muted dark:text-dark-muted">
                  {inv.email} <span className="text-xs">· invited {daysAgo(inv.createdAt)}</span>
                </span>
                <button
                  onClick={() => handleResendInvite(inv.id)}
                  className="rounded-lg p-1.5 text-light-muted transition hover:text-brand-600 dark:text-dark-muted"
                  aria-label={`Resend invite to ${inv.email}`}
                  title="Resend"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleRevokeInvite(inv.id)}
                  className="rounded-lg p-1.5 text-light-muted transition hover:text-semantic-danger-700 dark:text-dark-muted"
                  aria-label={`Revoke invite to ${inv.email}`}
                  title="Revoke"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {duplicating && <DuplicateWorkspaceModal workspace={workspace} onClose={() => setDuplicating(false)} onCreated={handleDuplicated} />}
    </div>
  );
};

export default MembersCard;
