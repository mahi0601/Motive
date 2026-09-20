import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Bell, CheckCircle, Mail, Moon, RefreshCw, Settings as SettingsIcon, Star, Trash2, User, Users, X } from 'lucide-react';
import { Menu } from '@headlessui/react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { deleteAccount } from '../services/userService';
import { createCheckoutSession, reconcileCheckoutSession } from '../services/paymentService';
import { createInvite, listInvites, resendInvite, revokeInvite, updateMemberRole, removeMember } from '../services/workspaceService';
import { logger } from '../utils/logger';

const Settings = () => {
  const { user, logout, refreshUser } = useAuth();
  const { isDark: isDarkMode, toggleTheme: handleToggleTheme } = useTheme();
  const { workspace, loadWorkspace } = useWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();

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

  // Mirrors the backend's FREE_MEMBER_LIMIT (workspace.service.js) — purely a
  // UI hint for showing the upgrade nudge before submitting; the backend is
  // the actual source of truth/enforcement.
  const FREE_MEMBER_LIMIT = 2;
  const atMemberCap = !user?.isPro && (workspace?.members?.length || 0) >= FREE_MEMBER_LIMIT;

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

  const handleRemoveMember = async (memberUserId) => {
    try {
      await removeMember(workspace.id, memberUserId);
      loadWorkspace();
    } catch (err) {
      setInviteStatus({ type: 'error', message: err?.response?.data?.message || 'Could not remove that member.' });
    }
  };

  const daysAgo = (iso) => {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
    return days <= 0 ? 'today' : days === 1 ? '1 day ago' : `${days} days ago`;
  };

  // Upgrade flow — the buyer picks a currency, which decides which payment
  // methods Stripe can offer (see paymentService.js for the constraints).
  const CURRENCIES = [
    { code: 'usd', label: '$9.99 USD', methods: 'Card · Google Pay · Apple Pay' },
    { code: 'inr', label: '₹799 INR', methods: 'UPI (PhonePe, Google Pay, Paytm) · Card' },
  ];
  const [currency, setCurrency] = useState('usd');
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');
  const upgradeStatus = searchParams.get('upgrade'); // 'success' | 'cancelled' | null

  // Coming back from Stripe Checkout — reconcile directly against Stripe first
  // (covers UPI/delayed-notification methods, and a webhook that was ever
  // delayed or dropped: without this, isPro could stay false forever even
  // though the payment succeeded), then re-fetch the profile so `isPro`
  // reflects the confirmed state, then drop the query params.
  useEffect(() => {
    if (upgradeStatus !== 'success') return;
    const sessionId = searchParams.get('session_id');
    (sessionId ? reconcileCheckoutSession(sessionId) : Promise.resolve())
      .catch((e) => logger.warn('Failed to reconcile checkout session', { error: e.message }))
      .finally(() => {
        refreshUser().finally(() => {
          setSearchParams({}, { replace: true });
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upgradeStatus, refreshUser, setSearchParams]);

  const handleUpgrade = async () => {
    setUpgrading(true);
    setUpgradeError('');
    try {
      const { data } = await createCheckoutSession(currency);
      window.location.href = data.url; // hand off to Stripe Checkout
    } catch (err) {
      setUpgradeError(err?.response?.data?.message || 'Could not start checkout. Try again.');
      setUpgrading(false);
    }
  };

  // Account deletion flow
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteAccount = async () => {
    if (!password) {
      setDeleteError('Enter your password to confirm.');
      return;
    }
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteAccount(password);
      // Account + all data gone, cookie cleared server-side. Full reload clears
      // the in-memory access token, then land on the home page.
      window.location.assign('/');
    } catch (err) {
      setDeleteError(err?.response?.data?.message || 'Could not delete account.');
      setDeleting(false);
    }
  };

  const handleLogout = () => {
    logout(); // revokes refresh token, clears cookie + access token, redirects
  };

  // Previously a bare `alert('Email notifications enabled successfully!')`
  // that did nothing — no request, no persisted setting. There's no email
  // notification pipeline to wire this to yet (see the backend's dead
  // emailService.js), so the honest fix is to make the button do the one
  // real thing available today: request OS/browser notification permission,
  // which is what actually gates whether a `notification:new` socket push
  // can also show as a native browser notification.
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  const handleEnableAlerts = async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
  };

  return (
    <>
      <div className="flex justify-end px-4">
        <Menu as="div" className="relative inline-block text-left z-50">
          <Menu.Button className="rounded-full w-10 h-10 bg-brand-500 text-white flex items-center justify-center transition duration-300 hover:bg-brand-600">
            {user ? (
              <div className="w-full h-full rounded-full bg-brand-500 flex items-center justify-center text-sm font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
            ) : (
              <User className="text-xl" />
            )}
          </Menu.Button>
          <Menu.Items className="absolute right-0 mt-2 w-44 bg-light-surface dark:bg-dark-raised border border-light-border dark:border-dark-border rounded-xl shadow-xl py-1 text-sm">
            <Menu.Item>
              {({ active }) => (
                <Link
                  to="/profile"
                  className={`block px-4 py-2 transition duration-300 rounded-md ${
                    active
                      ? 'bg-brand-100 text-brand-700 dark:bg-brand-800 dark:text-white'
                      : 'text-light-text dark:text-dark-text'
                  } hover:bg-brand-100 hover:text-brand-700 dark:hover:bg-brand-800 dark:hover:text-white`}
                >
                  Profile
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
  {() => (
    <button
      onClick={handleLogout}
      className={`w-full text-left px-4 py-2 rounded-md font-medium transition duration-300
        bg-light-border/40 dark:bg-dark-surface
        text-brand-600 dark:text-brand-300
        hover:bg-brand-350 hover:text-brand-700
        dark:hover:bg-brand-800 dark:hover:text-white`}
    >
      Logout
    </button>
  )}
</Menu.Item>

          </Menu.Items>
        </Menu>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-light-text dark:text-dark-text p-8 rounded-2xl shadow-lg transition-all duration-300 border border-light-border dark:border-dark-border font-inter"
      >
        <h2 className="font-display text-display font-extrabold tracking-tight mb-6 flex items-center gap-3 text-light-text dark:text-dark-text">
          <SettingsIcon className="text-brand-500 animate-spin-slow" />
          Settings
        </h2>

        <p className="text-sm text-light-muted dark:text-dark-muted mb-8">
          Customize your experience. Adjust settings such as themes, notifications, and account preferences.
        </p>

        <div className="space-y-6">
          <div className="p-5 bg-light-surface dark:bg-dark-raised border border-light-border dark:border-dark-border rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="text-brand-500" />
                <h4 className="text-lg font-semibold">Theme Settings</h4>
              </div>
              <div
                className={`relative w-14 h-7 flex items-center bg-light-border dark:bg-dark-surface rounded-full p-1 cursor-pointer transition`}
                onClick={handleToggleTheme}
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
                    isDarkMode ? 'translate-x-7' : ''
                  }`}
                />
              </div>
            </div>
            <p className="text-sm text-light-muted dark:text-dark-muted mt-2">Toggle between Light and Dark mode.</p>
          </div>

          {/* Notifications */}
          <div className="p-5 bg-light-surface dark:bg-dark-raised border border-light-border dark:border-dark-border rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="text-brand-500" />
                <h4 className="text-lg font-semibold">Notifications</h4>
              </div>
              {notifPermission === 'granted' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-semantic-success-50 text-semantic-success-500 dark:bg-semantic-success-500/10 dark:text-semantic-success-dark">
                  <CheckCircle /> Enabled
                </span>
              ) : (
                <button
                  onClick={handleEnableAlerts}
                  disabled={notifPermission === 'denied' || notifPermission === 'unsupported'}
                  className="px-4 py-2 text-sm rounded-lg font-medium bg-light-surface dark:bg-transparent text-brand-600 border border-brand-600 hover:bg-brand-600 hover:text-white hover:border-transparent transition-all duration-300 shadow-sm hover:shadow-md dark:text-white dark:border-white disabled:opacity-60 disabled:hover:bg-light-surface disabled:hover:text-brand-600 dark:disabled:hover:bg-transparent"
                >
                  <Mail className="inline-block mr-1" /> Enable Alerts
                </button>
              )}
            </div>
            <p className="text-sm text-light-muted dark:text-dark-muted mt-2">
              {notifPermission === 'denied'
                ? 'Blocked in your browser settings — allow notifications for this site to enable.'
                : notifPermission === 'unsupported'
                ? 'Not supported in this browser.'
                : 'Show a desktop notification when Motive notifies you (comments, mentions).'}
            </p>
          </div>

          {/* Members — invite lifecycle. The invitee no longer needs an
              existing account (see workspace.service.js#createInvite); only
              the owner can invite, change roles, or remove someone, same
              authorization the backend enforces. */}
          <div className="p-5 bg-light-surface dark:bg-dark-raised border border-light-border dark:border-dark-border rounded-xl shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Users className="text-brand-500" />
              <h4 className="text-lg font-semibold">Members</h4>
            </div>
            <p className="text-sm text-light-muted dark:text-dark-muted mb-3">
              Invite a teammate by email — they'll get a link to join, whether or not they have a Motive account yet.
            </p>

            {isOwner && (
              atMemberCap ? (
                <p className="text-sm rounded-lg border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 px-3 py-2">
                  Free workspaces are limited to {FREE_MEMBER_LIMIT} members — upgrade to Motive Pro below to invite more.
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
              <p className={`text-sm mt-2 ${inviteStatus.type === 'error' ? 'text-semantic-danger-500 dark:text-semantic-danger-dark' : 'text-semantic-success-500 dark:text-semantic-success-dark'}`}>
                {inviteStatus.message}
              </p>
            )}

            {workspace?.members?.length > 0 && (
              <div className="mt-4 divide-y divide-light-border dark:divide-dark-border">
                {workspace.members.map((m) => (
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
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.userId, e.target.value)}
                          className="rounded-lg border border-light-border bg-light-surface px-2 py-1 text-xs dark:border-dark-border dark:bg-dark-raised"
                        >
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        <button
                          onClick={() => handleRemoveMember(m.userId)}
                          className="rounded-lg p-1.5 text-light-muted transition hover:text-semantic-danger-500 dark:text-dark-muted"
                          aria-label={`Remove ${m.user?.name}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <span className="text-xs capitalize text-light-muted dark:text-dark-muted">{m.role}</span>
                    )}
                  </div>
                ))}
              </div>
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
                        className="rounded-lg p-1.5 text-light-muted transition hover:text-semantic-danger-500 dark:text-dark-muted"
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
          </div>

          {/* Upgrade to Pro */}
          <div className="p-5 bg-light-surface dark:bg-dark-raised border border-light-border dark:border-dark-border rounded-xl shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Star className="text-brand-500" />
                <h4 className="text-lg font-semibold">Motive Pro</h4>
              </div>
              {user?.isPro && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-semantic-success-50 text-semantic-success-500 dark:bg-semantic-success-500/10 dark:text-semantic-success-dark">
                  <CheckCircle /> You're a Pro member
                </span>
              )}
            </div>
            <p className="text-sm text-light-muted dark:text-dark-muted mt-2">
              {user?.isPro
                ? 'Thanks for supporting Motive — all Pro features are unlocked.'
                : 'Unlock Pro features with a single one-time payment, no subscription.'}
            </p>

            {/* Naming what Pro actually unlocks — was previously left
                implicit (just "Pro features"), which is a bad look when
                there's more than one gate to be honest about. */}
            {!user?.isPro && (
              <ul className="mt-3 space-y-1.5 text-sm text-light-text dark:text-dark-text">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0 text-brand-500" />
                  Month and quarter views on Momentum, not just this week
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0 text-brand-500" />
                  Invite more than {FREE_MEMBER_LIMIT} workspace members
                </li>
              </ul>
            )}

            {!user?.isPro && (
              <>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {CURRENCIES.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setCurrency(c.code)}
                      className={`text-left rounded-lg border px-3 py-2 transition-all duration-200 ${
                        currency === c.code
                          ? 'border-brand-500 ring-1 ring-brand-500 bg-brand-50 dark:bg-brand-900/20'
                          : 'border-light-border dark:border-dark-border hover:border-brand-400'
                      }`}
                    >
                      <span className="block text-sm font-semibold text-light-text dark:text-dark-text">{c.label}</span>
                      <span className="block text-xs text-light-muted dark:text-dark-muted mt-0.5">{c.methods}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-light-muted dark:text-dark-muted mt-2">
                  Actual methods shown at checkout depend on what's enabled for this Stripe account — this is just what each currency makes possible.
                </p>
                {/* The one gradient on this screen — the highest-value action
                    here, so it's the one that keeps the spotlight (see
                    PLAN §4). Avatar badge / Enable Alerts / Invite above are
                    all tonal now for that reason. */}
                <button
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="mt-3 px-4 py-2 text-sm rounded-lg font-medium bg-brand-gradient text-white transition-all duration-300 shadow-brand-sm hover:shadow-brand disabled:opacity-60"
                >
                  {upgrading ? 'Redirecting…' : 'Upgrade — one-time payment'}
                </button>
              </>
            )}

            {upgradeError && <p className="text-xs text-semantic-danger-500 dark:text-semantic-danger-dark mt-2">{upgradeError}</p>}
            {upgradeStatus === 'cancelled' && !user?.isPro && (
              <p className="text-xs text-semantic-warning-500 dark:text-semantic-warning-dark mt-2">Checkout was cancelled — no charge was made.</p>
            )}
          </div>

          {/* Danger Zone — delete account. Red stays here deliberately (this
              is genuinely destructive, unlike Logout — see Header.jsx and
              Profile.jsx), now routed through the semantic-danger tokens
              instead of stock Tailwind red so it's the exact same hue as
              every other "danger" in the app, not a second, slightly
              different red. */}
          <div className="p-5 rounded-xl border border-semantic-danger-200 dark:border-semantic-danger-500/30 bg-semantic-danger-50/60 dark:bg-semantic-danger-500/10">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-semantic-danger-500 dark:text-semantic-danger-dark" />
              <h4 className="text-lg font-semibold text-semantic-danger-500 dark:text-semantic-danger-dark">Danger Zone</h4>
            </div>
            <p className="text-sm text-light-muted dark:text-dark-muted mt-2">
              Permanently delete your account and <strong>all</strong> of your pages, tasks, and data.
              This cannot be undone.
            </p>

            {!confirming ? (
              <button
                onClick={() => setConfirming(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-semantic-danger-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <Trash2 /> Delete account
              </button>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-medium text-light-text dark:text-dark-muted">
                  Enter your password to confirm deletion:
                </p>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setDeleteError('');
                  }}
                  placeholder="Your password"
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
                      setPassword('');
                      setDeleteError('');
                    }}
                    disabled={deleting}
                    className="rounded-lg border border-light-border dark:border-dark-border px-4 py-2 text-sm font-medium text-light-text dark:text-dark-text"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Settings;
