import React from 'react';
import { motion } from 'framer-motion';

const SubtaskItem = ({ subtask, onToggle }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
    >
      <input
        type="checkbox"
        checked={subtask.done}
        onChange={onToggle}
        className="accent-indigo-600 w-5 h-5 cursor-pointer transition-transform duration-200"
      />
      <span
        className={`text-sm font-medium transition-all duration-300 ${
          subtask.done ? 'line-through text-gray-400 italic' : 'text-gray-700'
        }`}
      >
        {subtask.title}
      </span>
    </motion.div>
  );
};

export default SubtaskItem;
