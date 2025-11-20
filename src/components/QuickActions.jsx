import React from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiFilter, FiSearch, FiCalendar, FiTrendingUp } from 'react-icons/fi';

const QuickActions = ({ onAddTask, onFilter, onSearch, onCalendar, onStats }) => {
  const actions = [
    {
      icon: <FiPlus className="w-5 h-5" />,
      label: 'New Task',
      onClick: onAddTask,
      gradient: 'from-indigo-600 to-purple-600',
      hover: 'from-indigo-700 to-purple-700'
    },
    {
      icon: <FiFilter className="w-5 h-5" />,
      label: 'Filter',
      onClick: onFilter,
      gradient: 'from-indigo-500 to-indigo-600',
      hover: 'from-indigo-600 to-indigo-700'
    },
    {
      icon: <FiSearch className="w-5 h-5" />,
      label: 'Search',
      onClick: onSearch,
      gradient: 'from-purple-500 to-indigo-600',
      hover: 'from-purple-600 to-indigo-700'
    },
    {
      icon: <FiCalendar className="w-5 h-5" />,
      label: 'Calendar',
      onClick: onCalendar,
      gradient: 'from-indigo-600 to-purple-500',
      hover: 'from-indigo-700 to-purple-600'
    },
    {
      icon: <FiTrendingUp className="w-5 h-5" />,
      label: 'Analytics',
      onClick: onStats,
      gradient: 'from-purple-600 to-indigo-500',
      hover: 'from-purple-700 to-indigo-600'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-3 mb-6"
    >
      {actions.map((action, index) => (
        <motion.button
          key={index}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={action.onClick}
          className={`flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r ${action.gradient} hover:bg-gradient-to-r ${action.hover} text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300`}
        >
          {action.icon}
          <span className="hidden sm:inline">{action.label}</span>
        </motion.button>
      ))}
    </motion.div>
  );
};

export default QuickActions;

