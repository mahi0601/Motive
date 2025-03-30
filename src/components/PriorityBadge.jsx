import React from 'react';

const PriorityBadge = ({ priority }) => {
  const getBadgeStyle = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300 ring-1 ring-red-200 dark:ring-red-700';
      case 'Medium':
        return 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-300 ring-1 ring-yellow-200 dark:ring-yellow-700';
      case 'Low':
        return 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-300 ring-1 ring-green-200 dark:ring-green-700';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-300 ring-1 ring-gray-300 dark:ring-gray-600';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full shadow-sm transition duration-200 ${getBadgeStyle(priority)}`}
    >
      {priority}
    </span>
  );
};

export default PriorityBadge;
