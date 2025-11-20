import React from 'react';
import { motion } from 'framer-motion';
import { FiBriefcase, FiHeart, FiActivity, FiDollarSign, FiCode, FiBook } from 'react-icons/fi';

const QuickTaskTemplates = ({ onSelectTemplate }) => {
  const templates = [
    {
      name: 'Work Task',
      icon: <FiBriefcase className="w-5 h-5" />,
      color: 'indigo',
      task: {
        category: 'Work',
        priority: 'High',
        tags: ['work', 'urgent']
      }
    },
    {
      name: 'Personal',
      icon: <FiHeart className="w-5 h-5" />,
      color: 'purple',
      task: {
        category: 'Personal',
        priority: 'Medium',
        tags: ['personal']
      }
    },
    {
      name: 'Health',
      icon: <FiActivity className="w-5 h-5" />,
      color: 'indigo',
      task: {
        category: 'Health',
        priority: 'Medium',
        tags: ['health', 'fitness']
      }
    },
    {
      name: 'Finance',
      icon: <FiDollarSign className="w-5 h-5" />,
      color: 'purple',
      task: {
        category: 'Finance',
        priority: 'High',
        tags: ['finance', 'budget']
      }
    },
    {
      name: 'Development',
      icon: <FiCode className="w-5 h-5" />,
      color: 'indigo',
      task: {
        category: 'Development',
        priority: 'High',
        tags: ['coding', 'dev']
      }
    },
    {
      name: 'Learning',
      icon: <FiBook className="w-5 h-5" />,
      color: 'purple',
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
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-md hover:shadow-xl hover:ring-1 hover:ring-indigo-500 transition-all duration-300"
    >
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Quick Templates</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {templates.map((template, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectTemplate(template.task)}
            className={`p-4 rounded-xl border-2 border-dashed transition-all ${
              template.color === 'indigo'
                ? 'border-indigo-300 dark:border-indigo-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                : 'border-purple-300 dark:border-purple-700 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20'
            }`}
          >
            <div className={`mb-2 ${
              template.color === 'indigo' 
                ? 'text-indigo-600 dark:text-indigo-400' 
                : 'text-purple-600 dark:text-purple-400'
            }`}>
              {template.icon}
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{template.name}</p>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default QuickTaskTemplates;

