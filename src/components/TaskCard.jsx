import React from 'react';
import { motion } from 'framer-motion';
import PriorityBadge from './PriorityBadge';
import { FiCalendar } from 'react-icons/fi';

const TaskCard = ({ task, onCalendarClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ scale: 1.02 }}
      className="relative border border-light-border dark:border-dark-border p-5 rounded-2xl shadow-md bg-light-surface dark:bg-dark-raised hover:shadow-xl hover:ring-1 hover:ring-brand-500 hover:border-brand-500 transition-all duration-300"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg text-light-text dark:text-white">{task.title}</h3>
        <PriorityBadge priority={task.priority} />
      </div>

      <p className="text-sm text-light-muted dark:text-dark-text mb-2">{task.description}</p>

      {task.dueDate && (
        <p className="text-xs text-light-muted dark:text-dark-muted italic mb-2">
          📅 Due: {new Date(task.dueDate).toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      )}

      <div className="flex justify-end mt-4">
        <button
          onClick={onCalendarClick}
          className="flex items-center gap-2 text-xs px-3 py-1 rounded-full border border-brand-600 text-brand-600 bg-light-surface dark:border-brand-400 dark:text-brand-400 dark:bg-transparent hover:bg-brand-gradient hover:text-white hover:border-transparent transition-all duration-300 shadow-sm hover:shadow-md"
        >
          <FiCalendar className="text-sm" />
        </button>
      </div>
    </motion.div>
  );
};

export default TaskCard;
