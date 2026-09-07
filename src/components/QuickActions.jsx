import React from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiFilter, FiSearch, FiCalendar, FiTrendingUp } from 'react-icons/fi';

const QuickActions = ({ onAddTask, onFilter, onSearch, onCalendar, onStats }) => {
  const actions = [
    {
      icon: <FiPlus className="w-5 h-5" />,
      label: 'New Task',
      onClick: onAddTask
    },
    {
      icon: <FiFilter className="w-5 h-5" />,
      label: 'Filter',
      onClick: onFilter
    },
    {
      icon: <FiSearch className="w-5 h-5" />,
      label: 'Search',
      onClick: onSearch
    },
    {
      icon: <FiCalendar className="w-5 h-5" />,
      label: 'Calendar',
      onClick: onCalendar
    },
    {
      icon: <FiTrendingUp className="w-5 h-5" />,
      label: 'Analytics',
      onClick: onStats
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
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-gradient text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300"
        >
          {action.icon}
          <span className="hidden sm:inline">{action.label}</span>
        </motion.button>
      ))}
    </motion.div>
  );
};

export default QuickActions;

