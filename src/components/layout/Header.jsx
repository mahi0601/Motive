import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, LogOut, Bell, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '../ui/Logo';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import { useNotificationSocket } from '../../context/NotificationSocketContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import NotificationCenter from '../notifications/NotificationCenter';

const Header = () => {
  const { isDark, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const { canInstall, promptInstall } = useInstallPrompt();
  const [notifOpen, setNotifOpen] = useState(false);
  const { unreadCount, setUnreadCount } = useNotificationSocket();
  const { workspace, workspaces, switchWorkspace } = useWorkspace();

  const initial = (user?.name || user?.email || '?').trim().charAt(0).toUpperCase();

  const handleUnreadChange = useCallback((count) => setUnreadCount(count), [setUnreadCount]);

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 70 }}
      className="z-30 flex w-full items-center justify-between border-b border-light-border bg-light-surface pb-3 pl-16 pr-4 pt-[calc(0.75rem+env(safe-area-inset-top))] dark:border-dark-border dark:bg-dark-surface sm:pr-6 lg:pl-6"
    >
      {/* pl-16 on mobile leaves room for the floating menu button */}
      <div className="flex items-center gap-3">
        <Link to="/" className="inline-block transition-transform duration-300 hover:scale-[1.03]">
          <Logo size={28} />
        </Link>
        {/* Only appears once it's actually needed — a solo user never sees
            it. See WorkspaceContext.jsx#switchWorkspace: without this, a
            workspace joined via invite would be created correctly on the
            backend and then never be reachable in the UI. */}
        {workspaces.length > 1 && (
          <select
            value={workspace?.id || ''}
            onChange={(e) => switchWorkspace(e.target.value)}
            className="hidden max-w-[160px] truncate rounded-lg border border-light-border bg-light-surface px-2 py-1.5 text-sm text-light-text dark:border-dark-border dark:bg-dark-raised dark:text-dark-text sm:block"
            aria-label="Switch workspace"
          >
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        )}
      </div>

      <nav className="flex items-center gap-2 sm:gap-3">
        {canInstall && (
          <button
            onClick={promptInstall}
            className="hidden items-center gap-1.5 rounded-full border border-light-border bg-light-surface px-3 py-2 text-sm font-medium text-light-text transition hover:bg-light-border/40 dark:border-dark-border dark:bg-dark-raised dark:text-dark-text dark:hover:bg-dark-border sm:flex"
            title="Install Motive"
          >
            <Download className="h-4 w-4" />
            Install
          </button>
        )}
        <button
          onClick={toggleTheme}
          className="rounded-full border border-light-border bg-light-surface p-2 transition hover:bg-light-border/40 dark:border-dark-border dark:bg-dark-raised dark:hover:bg-dark-border"
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun className="h-5 w-5 text-brand-400" />
          ) : (
            <Moon className="h-5 w-5 text-light-text dark:text-dark-text" />
          )}
        </button>

        {isAuthenticated ? (
          <>
            <button
              onClick={() => setNotifOpen(true)}
              className="relative rounded-full border border-light-border bg-light-surface p-2 transition hover:bg-light-border/40 dark:border-dark-border dark:bg-dark-raised dark:hover:bg-dark-border"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-light-text dark:text-dark-text" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <Link
              to="/profile"
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition hover:bg-light-border/40 dark:hover:bg-white/5"
              title="Profile"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
                {initial}
              </span>
              <span className="hidden max-w-[120px] truncate text-sm font-medium text-light-text dark:text-dark-text sm:inline">
                {user?.name || user?.email}
              </span>
            </Link>
            <button
              onClick={logout}
              className="rounded-lg p-2 text-light-muted transition hover:bg-light-border/40 hover:text-light-text dark:text-dark-muted dark:hover:bg-white/5 dark:hover:text-dark-text"
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
              className="rounded-lg border border-light-border px-3 py-1.5 text-sm text-light-text transition hover:border-brand-500 hover:text-brand-600 dark:border-dark-border dark:text-dark-text"
            >
              Login
            </Link>
            {/* Tonal, not gradient, for consistency with the rest of the
                gradient-budget pass (PLAN §4) — chrome/nav elements read as
                secondary to whatever a screen's one primary action is. (This
                whole `!user` branch is currently unreachable: Header only
                renders inside DashboardLayout, which sits behind
                ProtectedRoute, so it never renders logged-out — worth
                knowing if Header is ever reused outside that layout.) */}
            <Link
              to="/register"
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700"
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
