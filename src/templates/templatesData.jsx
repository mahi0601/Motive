// templatesData.jsx
import { FiUser, FiBriefcase, FiHeart, FiTarget } from 'react-icons/fi';

export const templatesData = [
  {
    id: 'personal',
    title: 'Personal Planner',
    description: 'Manage your daily tasks, habits, and goals.',
    icon: FiUser,
    fields: ['Task Name', 'Due Date', 'Priority', 'Notes'],
  },
  {
    id: 'work',
    title: 'Work Tasks',
    description: 'Organize your work projects and deadlines.',
    icon: FiBriefcase,
    fields: ['Project', 'Task', 'Status', 'Deadline'],
  },
  {
    id: 'wellness',
    title: 'Health & Wellness',
    description: 'Track your workouts, meals, and health logs.',
    icon: FiHeart,
    fields: ['Activity', 'Duration', 'Calories Burned', 'Mood'],
  },
  {
    id: 'goals',
    title: 'Goal Tracker',
    description: 'Define long-term goals and break them down.',
    icon: FiTarget,
    fields: ['Goal', 'Milestones', 'Deadline', 'Progress'],
  },
];
