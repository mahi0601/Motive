import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

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
                ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800'
                : notification.type === 'error'
                ? 'bg-brand-100 dark:bg-brand-900/30 border-brand-300 dark:border-brand-700'
                : 'bg-semantic-info-50 dark:bg-semantic-info-500/10 border-semantic-info-200 dark:border-semantic-info-500/30'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${
                notification.type === 'success'
                  ? 'text-brand-600 dark:text-brand-400'
                  : notification.type === 'error'
                  ? 'text-brand-700 dark:text-brand-300'
                  : 'text-semantic-info-500 dark:text-semantic-info-dark'
              }`}>
                {notification.type === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : notification.type === 'error' ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <Info className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  notification.type === 'success'
                    ? 'text-brand-800 dark:text-brand-200'
                    : notification.type === 'error'
                    ? 'text-brand-800 dark:text-brand-200'
                    : 'text-semantic-info-500 dark:text-semantic-info-dark'
                }`}>
                  {notification.title}
                </p>
                {notification.message && (
                  <p className={`text-xs mt-1 ${
                    notification.type === 'success'
                      ? 'text-brand-700 dark:text-brand-300'
                      : notification.type === 'error'
                      ? 'text-brand-700 dark:text-brand-300'
                      : 'text-semantic-info-500 dark:text-semantic-info-dark'
                  }`}>
                    {notification.message}
                  </p>
                )}
              </div>
              {notification.action && (
                <button
                  onClick={() => {
                    notification.action.onAction();
                    onRemove(notification.id);
                  }}
                  className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-brand-600 hover:bg-black/10 dark:text-brand-400"
                >
                  {notification.action.label}
                </button>
              )}
              <button
                onClick={() => onRemove(notification.id)}
                className="p-1 hover:bg-black/10 rounded transition-colors"
              >
                <X className="w-4 h-4 text-light-muted" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationToast;

