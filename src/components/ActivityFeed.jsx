import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiPlus, FiEdit, FiTrash2, FiClock } from 'react-icons/fi';

const ActivityFeed = ({ limit = 5 }) => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('taskActivities');
    if (stored) {
      setActivities(JSON.parse(stored).slice(0, limit));
    }
  }, [limit]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'created':
        return <FiPlus className="w-4 h-4 text-indigo-500" />;
      case 'completed':
        return <FiCheckCircle className="w-4 h-4 text-indigo-600" />;
      case 'updated':
        return <FiEdit className="w-4 h-4 text-purple-500" />;
      case 'deleted':
        return <FiTrash2 className="w-4 h-4 text-indigo-700" />;
      default:
        return <FiClock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'created':
        return 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800';
      case 'completed':
        return 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800';
      case 'updated':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      case 'deleted':
        return 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  if (activities.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Activity</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No recent activity
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-lg transition-all duration-300"
    >
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <FiClock className="text-indigo-500" />
        Recent Activity
      </h3>
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-3 rounded-lg border ${getActivityColor(activity.type)}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  <span className="font-medium">{activity.taskTitle}</span>
                  <span className="text-gray-600 dark:text-gray-400"> {activity.message}</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ActivityFeed;

