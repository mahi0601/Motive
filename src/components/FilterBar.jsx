import React from 'react';
import { motion } from 'framer-motion';

const FilterBar = ({ filters, onChange }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6
                 bg-white dark:bg-[#2a2a2a]
                 border border-gray-200 dark:border-[#3a3a3a]
                 text-gray-800 dark:text-gray-100
                 p-5 rounded-2xl shadow-md transition-all"
    >
      {/* Priority Filter Dropdown */}
      <div className="w-full sm:w-1/3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Filter by Priority
        </label>
        <select
          value={filters.priority}
          onChange={(e) => onChange('priority', e.target.value)}
          className="w-full p-3 border border-gray-300 dark:border-[#3a3a3a]
                     bg-white dark:bg-[#1f1f1f]
                     text-gray-800 dark:text-gray-100
                     rounded-lg text-sm focus:outline-none
                     focus:ring-2 focus:ring-indigo-500 transition-all"
        >
          <option value="">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      <div className="w-full sm:w-2/3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Search Tasks
        </label>
        <input
          type="text"
          placeholder="Type to search..."
          value={filters.search}
          onChange={(e) => onChange('search', e.target.value)}
          className="w-full p-3 border border-gray-300 dark:border-[#3a3a3a]
                     bg-white dark:bg-[#1f1f1f]
                     text-gray-800 dark:text-gray-100
                     rounded-lg text-sm focus:outline-none
                     focus:ring-2 focus:ring-indigo-500 transition-all"
        />
      </div>
    </motion.div>
  );
};

export default FilterBar;
