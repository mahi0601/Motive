import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiPlus, FiEdit, FiTrash2, FiClock } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { getActivity } from '../services/activityService';

const ActivityFeed = ({ limit = 5 }) => {
  const { bootstrapping, isAuthenticated } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bootstrapping) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const { data } = await getActivity({ limit });
        setActivities(data.items || []);
      } catch (e) {
        console.error('Failed to load activity', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [bootstrapping, isAuthenticated, limit]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'created':
        return <FiPlus className="w-4 h-4 text-brand-500" />;
      case 'completed':
        return <FiCheckCircle className="w-4 h-4 text-brand-600" />;
      case 'updated':
        return <FiEdit className="w-4 h-4 text-spark-500" />;
      case 'deleted':
        return <FiTrash2 className="w-4 h-4 text-brand-700" />;
      default:
        return <FiClock className="w-4 h-4 text-light-muted" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'created':
        return 'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800';
      case 'completed':
        return 'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800';
      case 'updated':
        return 'bg-spark-50 dark:bg-spark-900/20 border-spark-200 dark:border-spark-800';
      case 'deleted':
        return 'bg-brand-100 dark:bg-brand-900/30 border-brand-300 dark:border-brand-700';
      default:
        return 'bg-light-border/30 dark:bg-dark-raised border-light-border dark:border-dark-border';
    }
  };

  if (loading || activities.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-light-surface dark:bg-dark-raised rounded-xl border border-light-border dark:border-dark-border p-6 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-4">Recent Activity</h3>
        <p className="text-sm text-light-muted dark:text-dark-muted text-center py-4">
          {loading ? 'Loading…' : 'No recent activity'}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-light-surface dark:bg-dark-raised rounded-xl border border-light-border dark:border-dark-border p-6 shadow-sm hover:shadow-lg transition-all duration-300"
    >
      <h3 className="text-lg font-semibold text-light-text dark:text-white mb-4 flex items-center gap-2">
        <FiClock className="text-brand-500" />
        Recent Activity
      </h3>
      <div className="space-y-3">
        {activities.map((activity) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-3 rounded-lg border ${getActivityColor(activity.action)}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {getActivityIcon(activity.action)}
              </div>
              <div className="flex-1">
                <p className="text-sm text-light-text dark:text-dark-text">
                  {activity.description}
                </p>
                <p className="text-xs text-light-muted dark:text-dark-muted mt-1">
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
