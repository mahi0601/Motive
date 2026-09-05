import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiX, FiCheckCircle, FiAlertCircle, FiInfo, FiMessageSquare, FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { getNotifications, markNotificationRead, clearNotifications } from '../services/notificationService';

const NotificationCenter = ({ isOpen, onClose, onUnreadChange }) => {
  const { bootstrapping, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (bootstrapping || !isAuthenticated) return;
    setLoading(true);
    try {
      const { data } = await getNotifications();
      const list = data.notifications || [];
      setNotifications(list);
      onUnreadChange?.(list.filter((n) => !n.read).length);
    } catch (e) {
      console.error('Failed to load notifications', e);
    } finally {
      setLoading(false);
    }
  }, [bootstrapping, isAuthenticated, onUnreadChange]);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  const markAsRead = async (id) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      onUnreadChange?.(updated.filter((n) => !n.read).length);
      return updated;
    });
    try {
      await markNotificationRead(id);
    } catch (e) {
      console.error('Failed to mark notification read', e);
    }
  };

  const clearAll = async () => {
    const prev = notifications;
    setNotifications([]);
    onUnreadChange?.(0);
    try {
      await clearNotifications();
    } catch (e) {
      console.error('Failed to clear notifications', e);
      setNotifications(prev); // roll back on failure
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'comment':
        return <FiMessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'success':
        return <FiCheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'error':
        return <FiAlertCircle className="w-5 h-5 text-indigo-700 dark:text-indigo-300" />;
      default:
        return <FiInfo className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
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
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiBell className="w-6 h-6 text-indigo-500" />
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearAll}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Clear all"
                >
                  <FiTrash2 className="w-5 h-5 text-gray-500" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto h-[calc(100vh-80px)]">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
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
                          ? 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-700'
                          : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 dark:text-white text-sm">
                            {notification.title}
                          </p>
                          {notification.message && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {notification.message}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-12">
                  <FiBell className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No notifications</p>
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
