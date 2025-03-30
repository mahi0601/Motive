import React from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import CommentsSection from '../components/CommentSection';
import { FiFileText, FiCalendar, FiZap } from 'react-icons/fi';

const TaskDetail = () => {
  const task = {
    title: 'Sample Task',
    description: 'Detailed description of the task',
    priority: 'Medium',
    dueDate: '2025-03-29',
    comments: ['Looks good', 'Need more info'],
  };

  return (
    <DashboardLayout>
      <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md max-w-4xl mx-auto mt-6">
        <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
          <FiFileText className="text-indigo-500" /> {task.title}
        </h2>

        <p className="text-gray-700 dark:text-gray-300 mb-4 text-base leading-relaxed">
          {task.description}
        </p>

        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <span className="flex items-center gap-1">
            <FiZap className="text-indigo-500" /> Priority: <span className="font-medium">{task.priority}</span>
          </span>
          <span className="flex items-center gap-1">
            <FiCalendar className="text-indigo-500" /> Due: <span className="font-medium">{task.dueDate}</span>
          </span>
        </div>

        <CommentsSection comments={task.comments} />
      </div>
    </DashboardLayout>
  );
};

export default TaskDetail;
