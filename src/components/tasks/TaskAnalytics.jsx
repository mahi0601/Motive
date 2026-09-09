import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react';

const TaskAnalytics = ({ tasks = [] }) => {
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed' || t.completed).length,
    pending: tasks.filter(t => !t.completed && t.status !== 'completed').length,
    overdue: tasks.filter(t => {
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < new Date() && !t.completed;
    }).length,
    highPriority: tasks.filter(t => t.priority === 'High' && !t.completed).length
  };

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const analytics = [
    {
      label: 'Total Tasks',
      value: stats.total,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-brand-600 dark:text-brand-400',
      bg: 'bg-brand-50 dark:bg-brand-900/20'
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'text-brand-600 dark:text-brand-400',
      bg: 'bg-brand-50 dark:bg-brand-900/20'
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: <Clock className="w-5 h-5" />,
      color: 'text-spark-600 dark:text-spark-400',
      bg: 'bg-spark-50 dark:bg-spark-900/20'
    },
    {
      label: 'Overdue',
      value: stats.overdue,
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'text-brand-700 dark:text-brand-300',
      bg: 'bg-brand-100 dark:bg-brand-900/30'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
    >
      {analytics.map((stat, index) => (
        <motion.div
          key={index}
          whileHover={{ scale: 1.05, y: -4 }}
          className={`${stat.bg} p-4 rounded-xl border border-light-border dark:border-dark-border shadow-sm hover:shadow-lg transition-all duration-300`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`${stat.color}`}>
              {stat.icon}
            </div>
            <span className="text-2xl font-bold text-light-text dark:text-dark-text">
              {stat.value}
            </span>
          </div>
          <p className="text-sm text-light-muted dark:text-dark-muted">{stat.label}</p>
        </motion.div>
      ))}

      <motion.div
        whileHover={{ scale: 1.05, y: -4 }}
        className="col-span-2 md:col-span-4 bg-brand-gradient p-6 rounded-xl shadow-brand-sm hover:shadow-brand transition-all duration-300"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/90 text-sm font-medium">Completion Rate</span>
          <span className="text-3xl font-bold text-white">{completionRate}%</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-3 mt-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionRate}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="bg-white h-3 rounded-full shadow-sm"
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TaskAnalytics;
