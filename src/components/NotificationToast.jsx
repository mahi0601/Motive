import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

const NotificationToast = ({ notifications, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            className={`min-w-[300px] max-w-md p-4 rounded-xl shadow-lg border ${
              notification.type === 'success'
                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
                : notification.type === 'error'
                ? 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700'
                : 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${
                notification.type === 'success'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : notification.type === 'error'
                  ? 'text-indigo-700 dark:text-indigo-300'
                  : 'text-purple-600 dark:text-purple-400'
              }`}>
                {notification.type === 'success' ? (
                  <FiCheckCircle className="w-5 h-5" />
                ) : notification.type === 'error' ? (
                  <FiAlertCircle className="w-5 h-5" />
                ) : (
                  <FiInfo className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  notification.type === 'success'
                    ? 'text-indigo-800 dark:text-indigo-200'
                    : notification.type === 'error'
                    ? 'text-indigo-800 dark:text-indigo-200'
                    : 'text-purple-800 dark:text-purple-200'
                }`}>
                  {notification.title}
                </p>
                {notification.message && (
                  <p className={`text-xs mt-1 ${
                    notification.type === 'success'
                      ? 'text-indigo-700 dark:text-indigo-300'
                      : notification.type === 'error'
                      ? 'text-indigo-700 dark:text-indigo-300'
                      : 'text-purple-700 dark:text-purple-300'
                  }`}>
                    {notification.message}
                  </p>
                )}
              </div>
              <button
                onClick={() => onRemove(notification.id)}
                className="p-1 hover:bg-black/10 rounded transition-colors"
              >
                <FiX className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationToast;

