import React from 'react';
import { motion } from 'framer-motion';
import { BarChart2, Calendar, Filter, Plus, Search } from 'lucide-react';

// Only the primary action (New Task) gets the brand gradient — five
// gradient buttons in a row was the single worst offender in the "everything
// looks equally important" design review (see PLAN §4). The rest are
// tonal/outlined so New Task actually reads as the primary action.
const QuickActions = ({ onAddTask, onFilter, onSearch, onCalendar, onMomentum }) => {
  const secondaryActions = [
    { icon: <Filter className="w-5 h-5" />, label: 'Filter', onClick: onFilter },
    { icon: <Search className="w-5 h-5" />, label: 'Search', onClick: onSearch },
    { icon: <Calendar className="w-5 h-5" />, label: 'Calendar', onClick: onCalendar },
    { icon: <BarChart2 className="w-5 h-5" />, label: 'Momentum', onClick: onMomentum },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-3 mb-6"
    >
      <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={onAddTask}
        className="flex items-center gap-2 px-4 py-2.5 bg-brand-gradient text-white rounded-xl font-medium shadow-brand-sm hover:shadow-brand transition-all duration-300"
      >
        <Plus className="w-5 h-5" />
        <span className="hidden sm:inline">New Task</span>
      </motion.button>

      {secondaryActions.map((action, index) => (
        <motion.button
          key={index}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={action.onClick}
          className="flex items-center gap-2 rounded-xl border border-light-border bg-light-surface px-4 py-2.5 font-medium text-light-text transition-all duration-300 hover:border-brand-500 hover:text-brand-600 dark:border-dark-border dark:bg-dark-raised dark:text-dark-text dark:hover:text-brand-400"
        >
          {action.icon}
          <span className="hidden sm:inline">{action.label}</span>
        </motion.button>
      ))}
    </motion.div>
  );
};

export default QuickActions;
