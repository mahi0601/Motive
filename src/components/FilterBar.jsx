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
                 p-5 rounded-2xl shadow-md hover:shadow-lg hover:ring-1 hover:ring-indigo-500 transition-all duration-300"
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
        <div className="relative">
          <input
            type="text"
            placeholder="Type to search..."
            value={filters.search}
            onChange={(e) => onChange('search', e.target.value)}
            className="w-full p-3 pl-10 border border-gray-300 dark:border-[#3a3a3a]
                       bg-white dark:bg-[#1f1f1f]
                       text-gray-800 dark:text-gray-100
                       rounded-lg text-sm focus:outline-none
                       focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          <svg className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
    </motion.div>
  );
};

export default FilterBar;
