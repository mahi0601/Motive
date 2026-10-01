import React from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, User } from 'lucide-react';
import { Menu } from '@headlessui/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeCard from '../components/settings/ThemeCard';
import NotificationsCard from '../components/settings/NotificationsCard';
import MembersCard from '../components/settings/MembersCard';
import StatusPageCard from '../components/settings/StatusPageCard';
import BillingCard from '../components/settings/BillingCard';
import DangerZoneCard from '../components/settings/DangerZoneCard';

// Layout only — each card owns its own state and data (see
// components/settings/). This file used to be a single 740-line component
// holding all of it.
const Settings = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout(); // revokes refresh token, clears cookie + access token, redirects
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
          <ThemeCard />
          <NotificationsCard />
          <MembersCard />
          <StatusPageCard />
          <BillingCard />
          <DangerZoneCard />
        </div>
      </motion.div>
    </>
  );
};

export default Settings;
