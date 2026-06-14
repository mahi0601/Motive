import React, { useState } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { motion } from 'framer-motion';
import { FiSettings, FiMoon, FiBell, FiLogOut, FiMail, FiUser, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import { Menu } from '@headlessui/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { deleteAccount } from '../services/userService';

const Settings = () => {
  const { user, logout } = useAuth();
  const { isDark: isDarkMode, toggleTheme: handleToggleTheme } = useTheme();

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
