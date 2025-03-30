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
      className="relative border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-md bg-white dark:bg-gray-800 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg text-gray-800 dark:text-white">{task.title}</h3>
        <PriorityBadge priority={task.priority} />
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{task.description}</p>

      {task.dueDate && (
        <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-2">
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
          className="flex items-center gap-2 text-xs px-3 py-1 rounded-full border border-indigo-600 text-indigo-600 bg-white dark:border-white dark:text-white dark:bg-transparent hover:bg-indigo-600 hover:text-white transition-colors duration-300"
        >
          <FiCalendar className="text-sm" />
        </button>
      </div>
    </motion.div>
  );
};

export default TaskCard;
