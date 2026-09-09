import React from 'react';
import { getPriorityBadgeClasses } from '../../utils/priorityColors';

const PriorityBadge = ({ priority }) => {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full shadow-sm transition duration-200 ${getPriorityBadgeClasses(priority)}`}
    >
      {priority}
    </span>
  );
};

export default PriorityBadge;
