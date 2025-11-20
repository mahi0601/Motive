import React from 'react';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiClock, FiTag } from 'react-icons/fi';
import PriorityBadge from './PriorityBadge';

const TemplatePreview = ({ template }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {template.preview.tasks.map((task, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-indigo-500 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                <h4 className="font-semibold text-gray-800 dark:text-white text-sm">{task}</h4>
              </div>
              <PriorityBadge priority={index % 3 === 0 ? 'High' : index % 3 === 1 ? 'Medium' : 'Low'} />
            </div>
            <div className="flex items-center gap-3 mt-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <FiTag className="w-3 h-3" />
                {template.category}
              </span>
              <span className="flex items-center gap-1">
                <FiClock className="w-3 h-3" />
                Today
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TemplatePreview;

