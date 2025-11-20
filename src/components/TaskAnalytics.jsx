import React from 'react';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiClock, FiAlertCircle, FiTrendingUp } from 'react-icons/fi';

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
      icon: <FiTrendingUp className="w-5 h-5" />,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20'
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: <FiCheckCircle className="w-5 h-5" />,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20'
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: <FiClock className="w-5 h-5" />,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      label: 'Overdue',
      value: stats.overdue,
      icon: <FiAlertCircle className="w-5 h-5" />,
      color: 'text-indigo-700 dark:text-indigo-300',
      bg: 'bg-indigo-100 dark:bg-indigo-900/30'
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
          className={`${stat.bg} p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`${stat.color}`}>
              {stat.icon}
            </div>
            <span className="text-2xl font-bold text-gray-800 dark:text-white">
              {stat.value}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
        </motion.div>
      ))}

      <motion.div
        whileHover={{ scale: 1.05, y: -4 }}
        className="col-span-2 md:col-span-4 bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
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

