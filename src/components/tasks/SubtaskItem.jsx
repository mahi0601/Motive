import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const SubtaskItem = ({ subtask, onToggle, onDelete }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.3 }}
      className="group flex items-center gap-3 rounded-lg border border-light-border p-2 transition-colors hover:bg-light-border/40 dark:border-dark-border dark:hover:bg-white/5"
    >
      <input
        type="checkbox"
        checked={subtask.done}
        onChange={onToggle}
        className="h-5 w-5 cursor-pointer accent-brand-600 transition-transform duration-200"
      />
      <span
        className={`flex-1 text-sm font-medium transition-all duration-300 ${
          subtask.done ? 'italic text-light-muted line-through' : 'text-light-text dark:text-dark-text'
        }`}
      >
        {subtask.title}
      </span>
      {onDelete && (
        <button
          onClick={onDelete}
          className="rounded p-1 text-light-muted opacity-0 transition-opacity hover:bg-light-border hover:text-red-500 group-hover:opacity-100 dark:hover:bg-dark-raised"
          aria-label="Delete subtask"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  );
};

export default SubtaskItem;
