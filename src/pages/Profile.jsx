import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, LogOut, Mail, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loginTime, setLoginTime] = useState(null);

  useEffect(() => {
    const loginTimestamp = localStorage.getItem('loginTime');
    if (loginTimestamp) setLoginTime(new Date(loginTimestamp).toLocaleString());
  }, []);

  const handleLogout = () => {
    logout(); // revokes refresh token, clears cookie + access token, redirects
  };

  return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-2xl p-8 font-inter text-light-text dark:text-dark-text"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <User className="text-brand-500" />
            Profile
          </h2>

          <motion.button
            onClick={() => navigate(-1)}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-light-border/40 dark:bg-dark-raised text-light-text dark:text-dark-muted border border-light-border dark:border-dark-border hover:bg-brand-gradient hover:text-white transition-all duration-300"
          >
            <ArrowLeft />
            Back
          </motion.button>
        </div>

        {/* Profile Info Card */}
        <div className="p-6 bg-light-surface dark:bg-dark-raised border border-light-border dark:border-dark-border rounded-xl shadow-md">
          <div className="flex items-center gap-5 mb-3">
            <div className="w-16 h-16 rounded-full bg-brand-gradient text-white text-2xl font-bold flex items-center justify-center shadow-md">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className="text-xl font-semibold">{user?.name || 'Unnamed User'}</h3>
              <p className="text-sm text-light-muted dark:text-dark-muted flex items-center gap-2">
                <Mail /> {user?.email || 'No email found'}
              </p>
              {loginTime && (
                <p className="text-sm text-light-muted dark:text-dark-muted mt-1 flex items-center gap-2">
                  <Clock /> Logged in since: {loginTime}
                </p>
              )}
            </div>
          </div>
          <div className="mt-4 text-sm text-light-muted dark:text-dark-muted">
            🔔 <span className="font-medium">Tip:</span> Keep your profile up to date for the best experience.
          </div>
        </div>

        <div className="mt-6 p-6 bg-light-surface dark:bg-dark-raised border border-light-border dark:border-dark-border rounded-xl shadow-md flex justify-between items-center">
          <div className="flex items-center gap-3">
            <LogOut className="text-red-500" />
            <h4 className="text-lg font-medium text-red-600 dark:text-red-400">Logout</h4>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border border-red-400 hover:bg-red-200 dark:hover:bg-red-800 transition"
          >
            Confirm Logout
          </button>
        </div>
      </motion.div>
  );
};

export default Profile;
