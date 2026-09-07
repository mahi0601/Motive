import React from 'react';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiClock, FiCalendar } from 'react-icons/fi';
import PriorityBadge from './PriorityBadge';

const TaskTimeline = ({ tasks = [] }) => {
  const sortedTasks = [...tasks].sort((a, b) => {
    const dateA = a.dueDate ? new Date(a.dueDate) : new Date(0);
    const dateB = b.dueDate ? new Date(b.dueDate) : new Date(0);
    return dateA - dateB;
  });

  const groupTasksByDate = () => {
    const grouped = {};
    sortedTasks.forEach(task => {
      const date = task.dueDate 
        ? new Date(task.dueDate).toLocaleDateString()
        : 'No due date';
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(task);
    });
    return grouped;
  };

  const groupedTasks = groupTasksByDate();

  return (
    <div className="space-y-6">
      {Object.entries(groupedTasks).map(([date, dateTasks], groupIndex) => (
        <motion.div
          key={date}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: groupIndex * 0.1 }}
          className="relative"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-brand-600 rounded-full" />
              <h3 className="text-lg font-semibold text-light-text dark:text-white flex items-center gap-2">
                <FiCalendar className="text-brand-500" />
                {date}
              </h3>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-brand-200 to-transparent dark:from-brand-800" />
            <span className="text-sm text-light-muted dark:text-dark-muted">
              {dateTasks.length} {dateTasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>

          <div className="ml-7 space-y-3">
            {dateTasks.map((task, index) => (
              <motion.div
                key={task.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (groupIndex * 0.1) + (index * 0.05) }}
                className="relative pl-6 border-l-2 border-brand-200 dark:border-brand-800"
              >
                <div className="absolute -left-2 top-2">
                  {task.completed ? (
                    <div className="w-4 h-4 bg-brand-600 rounded-full border-2 border-white dark:border-dark-raised flex items-center justify-center">
                      <FiCheckCircle className="w-2.5 h-2.5 text-white" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 bg-white dark:bg-dark-raised border-2 border-brand-600 rounded-full" />
                  )}
                </div>
                <div className="bg-light-surface dark:bg-dark-raised rounded-xl border border-light-border dark:border-dark-border p-4 shadow-sm hover:shadow-md hover:border-brand-500 transition-all duration-300">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className={`font-semibold ${
                          task.completed
                            ? 'line-through text-light-muted dark:text-dark-muted'
                            : 'text-light-text dark:text-white'
                        }`}>
                          {task.title}
                        </h4>
                        <PriorityBadge priority={task.priority} />
                      </div>
                      {task.description && (
                        <p className="text-sm text-light-muted dark:text-dark-muted mb-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-light-muted dark:text-dark-muted">
                        {task.category && (
                          <span className="px-2 py-0.5 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded">
                            {task.category}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <FiClock className="w-3 h-3" />
                          {task.dueDate ? new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No time'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default TaskTimeline;

