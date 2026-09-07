import React from 'react';
import { motion } from 'framer-motion';
import { FiBriefcase, FiHeart, FiActivity, FiDollarSign, FiCode, FiBook } from 'react-icons/fi';

const QuickTaskTemplates = ({ onSelectTemplate }) => {
  const templates = [
    {
      name: 'Work Task',
      icon: <FiBriefcase className="w-5 h-5" />,
      color: 'brand',
      task: {
        category: 'Work',
        priority: 'High',
        tags: ['work', 'urgent']
      }
    },
    {
      name: 'Personal',
      icon: <FiHeart className="w-5 h-5" />,
      color: 'spark',
      task: {
        category: 'Personal',
        priority: 'Medium',
        tags: ['personal']
      }
    },
    {
      name: 'Health',
      icon: <FiActivity className="w-5 h-5" />,
      color: 'brand',
      task: {
        category: 'Health',
        priority: 'Medium',
        tags: ['health', 'fitness']
      }
    },
    {
      name: 'Finance',
      icon: <FiDollarSign className="w-5 h-5" />,
      color: 'spark',
      task: {
        category: 'Finance',
        priority: 'High',
        tags: ['finance', 'budget']
      }
    },
    {
      name: 'Development',
      icon: <FiCode className="w-5 h-5" />,
      color: 'brand',
      task: {
        category: 'Development',
        priority: 'High',
        tags: ['coding', 'dev']
      }
    },
    {
      name: 'Learning',
      icon: <FiBook className="w-5 h-5" />,
      color: 'spark',
      task: {
        category: 'Personal',
        priority: 'Low',
        tags: ['learning', 'education']
      }
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-light-surface dark:bg-dark-raised rounded-xl border border-light-border dark:border-dark-border p-6 shadow-md hover:shadow-xl hover:ring-1 hover:ring-brand-500 transition-all duration-300"
    >
      <h3 className="text-lg font-semibold text-light-text dark:text-white mb-4">Quick Templates</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {templates.map((template, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectTemplate(template.task)}
            className={`p-4 rounded-xl border-2 border-dashed transition-all ${
              template.color === 'brand'
                ? 'border-brand-300 dark:border-brand-700 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20'
                : 'border-spark-300 dark:border-spark-700 hover:border-spark-500 hover:bg-spark-50 dark:hover:bg-spark-900/20'
            }`}
          >
            <div className={`mb-2 ${
              template.color === 'brand'
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-spark-600 dark:text-spark-400'
            }`}>
              {template.icon}
            </div>
            <p className="text-sm font-medium text-light-text dark:text-dark-text">{template.name}</p>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default QuickTaskTemplates;

