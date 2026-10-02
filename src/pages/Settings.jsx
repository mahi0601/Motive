import React from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AccountMenu from '../components/ui/AccountMenu';
import ThemeCard from '../components/settings/ThemeCard';
import NotificationsCard from '../components/settings/NotificationsCard';
import MembersCard from '../components/settings/MembersCard';
import StatusPageCard from '../components/settings/StatusPageCard';
import AccountCard from '../components/settings/AccountCard';
import BillingCard from '../components/settings/BillingCard';
import PlanUsageCard from '../components/settings/PlanUsageCard';
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
        <AccountMenu name={user?.name} onLogout={handleLogout} />
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
          <AccountCard />
          <PlanUsageCard />
          {/* #billing is where "See plans" links land. */}
          <div id="billing">
            <BillingCard />
          </div>
          <DangerZoneCard />
        </div>
      </motion.div>
    </>
  );
};

export default Settings;
