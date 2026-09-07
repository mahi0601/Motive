import React from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiTag, FiFlag, FiEdit, FiTrash2, FiCheckCircle, FiClock } from 'react-icons/fi';
import PriorityBadge from './PriorityBadge';

const EnhancedTaskCard = ({ task, onEdit, onDelete, onComplete, onCalendarClick, selectMode, selected, onSelectToggle }) => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
  const daysUntilDue = task.dueDate
    ? Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      onClick={selectMode ? onSelectToggle : undefined}
      className={`relative border rounded-2xl p-5 shadow-md bg-light-surface dark:bg-dark-raised transition-all duration-300 ${
        selectMode ? 'cursor-pointer' : ''
      } ${
        selected
          ? 'border-brand-500 ring-2 ring-brand-400'
          : task.completed
          ? 'border-brand-200 dark:border-brand-800 opacity-75'
          : isOverdue
          ? 'border-brand-400 dark:border-brand-600 ring-2 ring-brand-300 dark:ring-brand-800'
          : 'border-light-border dark:border-dark-border hover:border-brand-500 hover:ring-1 hover:ring-brand-500'
      }`}
    >
      {selectMode && (
        <div className="absolute top-4 left-4">
          <input
            type="checkbox"
            checked={!!selected}
            onChange={onSelectToggle}
            onClick={(e) => e.stopPropagation()}
            className="h-5 w-5 cursor-pointer accent-brand-500"
          />
        </div>
      )}

      {task.completed && (
        <div className="absolute top-4 right-4">
          <FiCheckCircle className="w-6 h-6 text-green-500" />
        </div>
      )}

      <div className={`flex justify-between items-start mb-3 ${selectMode ? 'pl-7' : ''}`}>
        <div className="flex-1">
          <h3 className={`font-semibold text-lg mb-1 ${
            task.completed
              ? 'line-through text-light-muted dark:text-dark-muted'
              : 'text-light-text dark:text-white'
          }`}>
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-light-muted dark:text-dark-text mb-2 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
        <PriorityBadge priority={task.priority} />
      </div>

      {task.category && (
        <div className="mb-2">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-md text-xs font-medium">
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
              className="px-2 py-0.5 bg-light-border/40 dark:bg-dark-raised text-light-muted dark:text-dark-muted rounded text-xs"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {task.dueDate && (
        <div className={`flex items-center gap-2 mb-3 text-sm ${
          isOverdue
            ? 'text-brand-700 dark:text-brand-300 font-medium'
            : daysUntilDue !== null && daysUntilDue <= 3
            ? 'text-spark-600 dark:text-spark-400'
            : 'text-light-muted dark:text-dark-muted'
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

      {!selectMode && (
      <div className="flex items-center justify-between pt-3 border-t border-light-border dark:border-dark-border">
        <div className="flex items-center gap-2">
          {onCalendarClick && (
            <button
              onClick={onCalendarClick}
              className="p-2 bg-light-surface dark:bg-dark-raised border border-light-border dark:border-dark-border hover:border-brand-500 dark:hover:border-brand-500 text-brand-600 dark:text-brand-400 rounded-lg transition-all shadow-sm hover:shadow-md"
              title="Add to Calendar"
            >
              <FiCalendar className="w-4 h-4" />
            </button>
          )}
          {onComplete && (
            <button
              onClick={() => onComplete(task)}
              className={`p-2 rounded-lg transition-all shadow-sm hover:shadow-md bg-light-surface dark:bg-dark-raised border ${
                task.completed
                  ? 'border-brand-500 dark:border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-light-border dark:border-dark-border hover:border-brand-500 dark:hover:border-brand-500 text-light-muted dark:text-dark-muted hover:text-brand-600 dark:hover:text-brand-400'
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
              className="p-2 bg-light-surface dark:bg-dark-raised border border-light-border dark:border-dark-border hover:border-spark-500 dark:hover:border-spark-500 text-spark-600 dark:text-spark-400 rounded-lg transition-all shadow-sm hover:shadow-md"
              title="Edit task"
            >
              <FiEdit className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(task)}
              className="p-2 bg-light-surface dark:bg-dark-raised border border-light-border dark:border-dark-border hover:border-brand-500 dark:hover:border-brand-500 text-brand-700 dark:text-brand-300 rounded-lg transition-all shadow-sm hover:shadow-md"
              title="Delete task"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      )}
    </motion.div>
  );
};

export default EnhancedTaskCard;

