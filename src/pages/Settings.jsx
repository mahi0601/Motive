import React, { useEffect, useState } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { motion } from 'framer-motion';
import { FiSettings, FiMoon, FiBell, FiLogOut, FiMail, FiUser, FiTrash2, FiAlertTriangle, FiStar, FiCheckCircle, FiUsers } from 'react-icons/fi';
import { Menu } from '@headlessui/react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { deleteAccount } from '../services/userService';
import { createCheckoutSession } from '../services/paymentService';
import { inviteMember } from '../services/workspaceService';

const Settings = () => {
  const { user, logout, refreshUser } = useAuth();
  const { isDark: isDarkMode, toggleTheme: handleToggleTheme } = useTheme();
  const { workspace, loadWorkspace } = useWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();

  // Invite a teammate into the workspace — this is the only way another real
  // person ever becomes @mentionable (there's no other sharing mechanism).
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState(null); // { type: 'success'|'error', message }
  const [inviting, setInviting] = useState(false);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
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
      await inviteMember(workspace.id, inviteEmail.trim());
      setInviteStatus({ type: 'success', message: `Added ${inviteEmail.trim()} to your workspace.` });
      setInviteEmail('');
      loadWorkspace(); // refresh so the new member shows up immediately
    } catch (err) {
      setInviteStatus({ type: 'error', message: err?.response?.data?.message || 'Could not invite that user.' });
    } finally {
      setInviting(false);
    }
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

  // Coming back from Stripe Checkout — re-fetch the profile so `isPro` reflects
  // the webhook's update, then drop the query param so a refresh doesn't re-trigger it.
  useEffect(() => {
    if (upgradeStatus !== 'success') return;
    refreshUser().finally(() => {
      setSearchParams({}, { replace: true });
    });
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

  const handleEmailAlert = () => {
    alert('📩 Email notifications enabled successfully!');
  };

  return (
    <DashboardLayout>
      <div className="flex justify-end px-4">
        <Menu as="div" className="relative inline-block text-left z-50">
          <Menu.Button className="rounded-full w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center hover:from-indigo-700 hover:to-purple-700 transition duration-300 shadow-md hover:shadow-lg">
            {user ? (
              <div className="w-full h-full rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
            ) : (
              <FiUser className="text-xl" />
            )}
          </Menu.Button>
          <Menu.Items className="absolute right-0 mt-2 w-44 bg-white dark:bg-[#2b2b2b] border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl py-1 text-sm">
            <Menu.Item>
              {({ active }) => (
                <Link
                  to="/profile"
                  className={`block px-4 py-2 transition duration-300 rounded-md ${
                    active
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-800 dark:text-white'
                      : 'text-gray-800 dark:text-gray-100'
                  } hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-800 dark:hover:text-white`}
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
        bg-gray-100 dark:bg-gray-700 
        text-indigo-600 dark:text-indigo-300 
        hover:bg-indigo-350 hover:text-indigo-700 
        dark:hover:bg-indigo-800 dark:hover:text-white`}
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
        className="bg-[#f9f9f9] dark:bg-[#0d0d0d] text-gray-900 dark:text-gray-100 p-8 rounded-2xl shadow-lg hover:shadow-xl hover:ring-1 hover:ring-indigo-500 transition-all duration-300 border border-gray-200 dark:border-gray-700 font-inter"
      >
        <h2 className="text-3xl font-extrabold tracking-tight mb-6 flex items-center gap-3 text-gray-800 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300">
          <FiSettings className="text-indigo-500 animate-spin-slow" />
          Settings
        </h2>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
          Customize your experience. Adjust settings such as themes, notifications, and account preferences.
        </p>

        <div className="space-y-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-5 bg-white dark:bg-[#2b2b2b] border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm hover:shadow-lg hover:ring-1 hover:ring-indigo-500 hover:border-indigo-500 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiMoon className="text-indigo-500" />
                <h4 className="text-lg font-semibold">Theme Settings</h4>
              </div>
              <div
                className={`relative w-14 h-7 flex items-center bg-gray-300 dark:bg-gray-700 rounded-full p-1 cursor-pointer transition`}
                onClick={handleToggleTheme}
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
                    isDarkMode ? 'translate-x-7' : ''
                  }`}
                />
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Toggle between Light and Dark mode.</p>
          </motion.div>

          {/* Notifications */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-5 bg-white dark:bg-[#2b2b2b] border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm hover:shadow-lg hover:ring-1 hover:ring-indigo-500 hover:border-indigo-500 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiBell className="text-indigo-500" />
                <h4 className="text-lg font-semibold">Notifications</h4>
              </div>
              <button
                onClick={handleEmailAlert}
                className="px-4 py-2 text-sm rounded-lg font-medium bg-white dark:bg-transparent text-indigo-600 border border-indigo-600 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 hover:text-white hover:border-transparent transition-all duration-300 shadow-sm hover:shadow-md dark:text-white dark:border-white"
              >
                <FiMail className="inline-block mr-1" /> Enable Alerts
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Enable email alerts and notifications.</p>
          </motion.div>

          {/* Workspace members — the only way another person becomes @mentionable */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-5 bg-white dark:bg-[#2b2b2b] border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm hover:shadow-lg hover:ring-1 hover:ring-indigo-500 hover:border-indigo-500 transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-2">
              <FiUsers className="text-indigo-500" />
              <h4 className="text-lg font-semibold">Workspace</h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Invite a teammate by email — they'll be able to comment and be @mentioned on your tasks.
            </p>
            <form onSubmit={handleInvite} className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teammate@example.com"
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
              <button
                type="submit"
                disabled={inviting}
                className="px-4 py-2 text-sm rounded-lg font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm hover:shadow-md transition-all disabled:opacity-60"
              >
                {inviting ? 'Inviting…' : 'Invite'}
              </button>
            </form>
            {inviteStatus && (
              <p className={`text-sm mt-2 ${inviteStatus.type === 'error' ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                {inviteStatus.message}
              </p>
            )}
            {workspace?.members?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {workspace.members.map((m) => (
                  <span
                    key={m.id}
                    className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    {m.user?.name} {m.role === 'owner' ? '(you)' : ''}
                  </span>
                ))}
              </div>
            )}
          </motion.div>

          {/* Upgrade to Pro */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-5 bg-white dark:bg-[#2b2b2b] border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm hover:shadow-lg hover:ring-1 hover:ring-indigo-500 hover:border-indigo-500 transition-all duration-300"
          >
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <FiStar className="text-indigo-500" />
                <h4 className="text-lg font-semibold">Motive Pro</h4>
              </div>
              {user?.isPro && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <FiCheckCircle /> You're a Pro member
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {user?.isPro
                ? 'Thanks for supporting Motive — all Pro features are unlocked.'
                : 'Unlock Pro features with a single one-time payment, no subscription.'}
            </p>

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
                          ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-indigo-400'
                      }`}
                    >
                      <span className="block text-sm font-semibold text-gray-800 dark:text-gray-100">{c.label}</span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">{c.methods}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Actual methods shown at checkout depend on what's enabled for this Stripe account — this is just what each currency makes possible.
                </p>
                <button
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="mt-3 px-4 py-2 text-sm rounded-lg font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-60"
                >
                  {upgrading ? 'Redirecting…' : 'Upgrade — one-time payment'}
                </button>
              </>
            )}

            {upgradeError && <p className="text-xs text-red-500 mt-2">{upgradeError}</p>}
            {upgradeStatus === 'cancelled' && !user?.isPro && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">Checkout was cancelled — no charge was made.</p>
            )}
          </motion.div>

          {/* Danger Zone — delete account */}
          <div className="p-5 rounded-xl border border-red-300 dark:border-red-900/60 bg-red-50/60 dark:bg-red-900/10">
            <div className="flex items-center gap-3">
              <FiAlertTriangle className="text-red-500" />
              <h4 className="text-lg font-semibold text-red-600 dark:text-red-400">Danger Zone</h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Permanently delete your account and <strong>all</strong> of your pages, tasks, and data.
              This cannot be undone.
            </p>

            {!confirming ? (
              <button
                onClick={() => setConfirming(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg !bg-red-600 px-4 py-2 text-sm font-semibold text-white !border-0 transition hover:!bg-red-700"
              >
                <FiTrash2 /> Delete account
              </button>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
                  className="w-full max-w-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1f1f1f] px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
                />
                {deleteError && <p className="text-xs text-red-500">{deleteError}</p>}
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="rounded-lg !bg-red-600 px-4 py-2 text-sm font-semibold text-white !border-0 transition hover:!bg-red-700 disabled:opacity-60"
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
                    className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Settings;
