import React from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiTag, FiFlag, FiEdit, FiTrash2, FiCheckCircle, FiClock } from 'react-icons/fi';
import PriorityBadge from './PriorityBadge';

const EnhancedTaskCard = ({ task, onEdit, onDelete, onComplete, onCalendarClick }) => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
  const daysUntilDue = task.dueDate 
    ? Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className={`relative border rounded-2xl p-5 shadow-md bg-white dark:bg-gray-800 transition-all duration-300 ${
        task.completed
          ? 'border-indigo-200 dark:border-indigo-800 opacity-75'
          : isOverdue
          ? 'border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-300 dark:ring-indigo-800'
          : 'border-gray-200 dark:border-gray-700 hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500'
      }`}
    >
      {task.completed && (
        <div className="absolute top-4 right-4">
          <FiCheckCircle className="w-6 h-6 text-green-500" />
        </div>
      )}

      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className={`font-semibold text-lg mb-1 ${
            task.completed
              ? 'line-through text-gray-500 dark:text-gray-500'
              : 'text-gray-800 dark:text-white'
          }`}>
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
        <PriorityBadge priority={task.priority} />
      </div>

      {task.category && (
        <div className="mb-2">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-md text-xs font-medium">
            <FiTag className="w-3 h-3" />
            {task.category}
          </span>
        </div>
      )}

      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {task.dueDate && (
        <div className={`flex items-center gap-2 mb-3 text-sm ${
          isOverdue
            ? 'text-indigo-700 dark:text-indigo-300 font-medium'
            : daysUntilDue !== null && daysUntilDue <= 3
            ? 'text-purple-600 dark:text-purple-400'
            : 'text-gray-600 dark:text-gray-400'
        }`}>
          <FiCalendar className="w-4 h-4" />
          <span>
            {isOverdue
              ? `Overdue: ${new Date(task.dueDate).toLocaleDateString()}`
              : daysUntilDue === 0
              ? 'Due today'
              : daysUntilDue === 1
              ? 'Due tomorrow'
              : daysUntilDue < 0
              ? `Overdue by ${Math.abs(daysUntilDue)} days`
              : `Due in ${daysUntilDue} days`}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {onCalendarClick && (
            <button
              onClick={onCalendarClick}
              className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-500 text-indigo-600 dark:text-indigo-400 rounded-lg transition-all shadow-sm hover:shadow-md"
              title="Add to Calendar"
            >
              <FiCalendar className="w-4 h-4" />
            </button>
          )}
          {onComplete && (
            <button
              onClick={() => onComplete(task)}
              className={`p-2 rounded-lg transition-all shadow-sm hover:shadow-md bg-white dark:bg-gray-700 border ${
                task.completed
                  ? 'border-indigo-500 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-gray-200 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-500 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
              title={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
            >
              <FiCheckCircle className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(task)}
              className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-500 text-purple-600 dark:text-purple-400 rounded-lg transition-all shadow-sm hover:shadow-md"
              title="Edit task"
            >
              <FiEdit className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(task)}
              className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-500 text-indigo-700 dark:text-indigo-300 rounded-lg transition-all shadow-sm hover:shadow-md"
              title="Delete task"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default EnhancedTaskCard;

