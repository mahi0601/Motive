import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Bell, CheckCircle, Info, MessageSquare, Trash2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getNotifications, markNotificationRead, clearNotifications } from '../../services/notificationService';
import { logger } from '../../utils/logger';

const NotificationCenter = ({ isOpen, onClose, onUnreadChange }) => {
  const { bootstrapping, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCountState] = useState(0);
  const [loading, setLoading] = useState(false);

  // `/api/notifications` is paginated — this panel shows the first page
  // (most recent), but the unread badge always comes from the server's
  // `unreadCount` (computed over ALL of a user's notifications), never from
  // filtering whatever page happens to be loaded locally.
  const load = useCallback(async () => {
    if (bootstrapping || !isAuthenticated) return;
    setLoading(true);
    try {
      const { data } = await getNotifications();
      setNotifications(data.items || []);
      setUnreadCountState(data.unreadCount || 0);
      onUnreadChange?.(data.unreadCount || 0);
    } catch (e) {
      logger.warn('Failed to load notifications', { error: e.message });
    } finally {
      setLoading(false);
    }
  }, [bootstrapping, isAuthenticated, onUnreadChange]);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  const markAsRead = async (id) => {
    let wasUnread = false;
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === id && !n.read) wasUnread = true;
        return n.id === id ? { ...n, read: true } : n;
      })
    );
    if (wasUnread) {
      const next = Math.max(0, unreadCount - 1);
      setUnreadCountState(next);
      onUnreadChange?.(next);
    }
    try {
      await markNotificationRead(id);
    } catch (e) {
      logger.warn('Failed to mark notification read', { notificationId: id, error: e.message });
    }
  };

  const clearAll = async () => {
    const prev = notifications;
    const prevUnread = unreadCount;
    setNotifications([]);
    setUnreadCountState(0);
    onUnreadChange?.(0);
    try {
      await clearNotifications();
    } catch (e) {
      logger.warn('Failed to clear notifications', { error: e.message });
      setNotifications(prev); // roll back on failure
      setUnreadCountState(prevUnread);
      onUnreadChange?.(prevUnread);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'comment':
        return <MessageSquare className="w-5 h-5 text-brand-600 dark:text-brand-400" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-brand-600 dark:text-brand-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-brand-700 dark:text-brand-300" />;
      default:
        return <Info className="w-5 h-5 text-spark-600 dark:text-spark-400" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="absolute right-0 top-0 h-full w-full max-w-md bg-light-surface dark:bg-dark-raised shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-light-surface dark:bg-dark-raised border-b border-light-border dark:border-dark-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-6 h-6 text-brand-500" />
                <h3 className="text-xl font-bold text-light-text dark:text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-brand-600 text-white text-xs font-bold rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearAll}
                  className="p-2 hover:bg-light-border/40 dark:hover:bg-dark-raised rounded-lg transition-colors"
                  title="Clear all"
                >
                  <Trash2 className="w-5 h-5 text-light-muted" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-light-border/40 dark:hover:bg-dark-raised rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-light-muted" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto h-[calc(100vh-80px)]">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                </div>
              ) : notifications.length > 0 ? (
                <div className="p-4 space-y-2">
                  {notifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        notification.read
                          ? 'bg-light-border/30 dark:bg-dark-raised/30 border-light-border dark:border-dark-border'
                          : 'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-light-text dark:text-white text-sm">
                            {notification.title}
                          </p>
                          {notification.message && (
                            <p className="text-xs text-light-muted dark:text-dark-muted mt-1">
                              {notification.message}
                            </p>
                          )}
                          <p className="text-xs text-light-muted dark:text-dark-muted mt-2">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-brand-600 rounded-full mt-2" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-12">
                  <Bell className="w-16 h-16 text-light-muted dark:text-dark-muted mb-4" />
                  <p className="text-light-muted dark:text-dark-muted">No notifications</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationCenter;
