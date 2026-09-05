import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, LogOut, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getNotifications } from '../services/notificationService';
import NotificationCenter from './NotificationCenter';

const Header = () => {
  const { isDark, toggleTheme } = useTheme();
  const { user, bootstrapping, isAuthenticated, logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const initial = (user?.name || user?.email || '?').trim().charAt(0).toUpperCase();

  // Initial unread count so the badge shows up before the panel is ever opened.
  useEffect(() => {
    if (bootstrapping || !isAuthenticated) return;
    (async () => {
      try {
        const { data } = await getNotifications();
        setUnreadCount((data.notifications || []).filter((n) => !n.read).length);
      } catch {
        /* badge just stays at 0 */
      }
    })();
  }, [bootstrapping, isAuthenticated]);

  const handleUnreadChange = useCallback((count) => setUnreadCount(count), []);

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 70 }}
      className="z-30 flex w-full items-center justify-between border-b border-gray-200 bg-white pb-3 pl-16 pr-4 pt-[calc(0.75rem+env(safe-area-inset-top))] dark:border-gray-700 dark:bg-[#1a1a1a] sm:pr-6 lg:pl-6"
    >
      {/* pl-16 on mobile leaves room for the floating menu button */}
      <Link to="/" className="inline-block transition-transform duration-300 hover:scale-[1.03]">
        <Logo size={28} />
      </Link>

      <nav className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={toggleTheme}
          className="rounded-full border border-gray-300 bg-white p-2 transition hover:bg-gray-100 dark:border-gray-600 dark:bg-[#2a2a2a] dark:hover:bg-gray-700"
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun className="h-5 w-5 text-spark-400" />
          ) : (
            <Moon className="h-5 w-5 text-gray-800 dark:text-gray-100" />
          )}
        </button>

        {isAuthenticated ? (
          <>
            <button
              onClick={() => setNotifOpen(true)}
              className="relative rounded-full border border-gray-300 bg-white p-2 transition hover:bg-gray-100 dark:border-gray-600 dark:bg-[#2a2a2a] dark:hover:bg-gray-700"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-gray-800 dark:text-gray-100" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <Link
              to="/profile"
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition hover:bg-gray-100 dark:hover:bg-white/5"
              title="Profile"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white">
                {initial}
              </span>
              <span className="hidden max-w-[120px] truncate text-sm font-medium text-gray-700 dark:text-gray-200 sm:inline">
                {user?.name || user?.email}
              </span>
            </Link>
            <button
              onClick={logout}
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-red-500 dark:text-gray-300 dark:hover:bg-white/5"
              title="Log out"
              aria-label="Log out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-800 transition hover:border-brand-500 hover:text-brand-600 dark:border-gray-600 dark:text-gray-100"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-brand-gradient px-3 py-1.5 text-sm font-medium text-white shadow-brand-sm transition hover:shadow-brand"
            >
              Sign Up
            </Link>
          </>
        )}
      </nav>

      <NotificationCenter
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        onUnreadChange={handleUnreadChange}
      />
    </motion.header>
  );
};

export default Header;
