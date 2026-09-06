import React from 'react';
import { motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';

const SubtaskItem = ({ subtask, onToggle, onDelete }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.3 }}
      className="group flex items-center gap-3 rounded-lg border border-gray-200 p-2 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-white/5"
    >
      <input
        type="checkbox"
        checked={subtask.done}
        onChange={onToggle}
        className="h-5 w-5 cursor-pointer accent-indigo-600 transition-transform duration-200"
      />
      <span
        className={`flex-1 text-sm font-medium transition-all duration-300 ${
          subtask.done ? 'italic text-gray-400 line-through' : 'text-gray-700 dark:text-gray-200'
        }`}
      >
        {subtask.title}
      </span>
      {onDelete && (
        <button
          onClick={onDelete}
          className="rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-gray-200 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-gray-700"
          aria-label="Delete subtask"
        >
          <FiX className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  );
};

export default SubtaskItem;
