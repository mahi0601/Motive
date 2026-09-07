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
            className="p-4 bg-light-surface dark:bg-dark-raised rounded-xl border border-light-border dark:border-dark-border shadow-sm hover:shadow-md hover:border-brand-500 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-brand-600 rounded-full" />
                <h4 className="font-semibold text-light-text dark:text-white text-sm">{task}</h4>
              </div>
              <PriorityBadge priority={index % 3 === 0 ? 'High' : index % 3 === 1 ? 'Medium' : 'Low'} />
            </div>
            <div className="flex items-center gap-3 mt-3 text-xs text-light-muted dark:text-dark-muted">
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

