import {
  FiUser, FiBriefcase, FiHeart, FiTarget, FiDollarSign, FiCode,
  FiBook, FiShoppingCart, FiHome, FiCamera, FiMusic, FiZap
} from 'react-icons/fi';

export const templatesData = [
  {
    id: 'personal',
    title: 'Personal Planner',
    description: 'Manage your daily tasks, habits, and personal goals with ease.',
    icon: FiUser,
    color: 'brand',
    category: 'Personal',
    fields: ['Task Name', 'Due Date', 'Priority', 'Notes'],
    preview: {
      tasks: ['Morning workout', 'Grocery shopping', 'Call family'],
      color: 'bg-brand-gradient'
    },
    popular: true
  },
  {
    id: 'work',
    title: 'Work Tasks',
    description: 'Organize your work projects, deadlines, and team collaborations.',
    icon: FiBriefcase,
    color: 'spark',
    category: 'Work',
    fields: ['Project', 'Task', 'Status', 'Deadline', 'Assignee'],
    preview: {
      tasks: ['Q4 Planning', 'Client meeting', 'Code review'],
      color: 'bg-spark-gradient'
    },
    popular: true
  },
  {
    id: 'wellness',
    title: 'Health & Wellness',
    description: 'Track your workouts, meals, meditation, and health logs.',
    icon: FiHeart,
    color: 'brand',
    category: 'Health',
    fields: ['Activity', 'Duration', 'Calories', 'Mood', 'Notes'],
    preview: {
      tasks: ['Morning run', 'Meal prep', 'Yoga session'],
      color: 'bg-brand-gradient'
    },
    popular: false
  },
  {
    id: 'goals',
    title: 'Goal Tracker',
    description: 'Define long-term goals and break them down into actionable milestones.',
    icon: FiTarget,
    color: 'spark',
    category: 'Goals',
    fields: ['Goal', 'Milestones', 'Deadline', 'Progress', 'Reward'],
    preview: {
      tasks: ['Learn Spanish', 'Save $10k', 'Run marathon'],
      color: 'bg-spark-gradient'
    },
    popular: true
  },
  {
    id: 'finance',
    title: 'Finance Tracker',
    description: 'Budget planning, expense tracking, and financial goal management.',
    icon: FiDollarSign,
    color: 'brand',
    category: 'Finance',
    fields: ['Expense', 'Amount', 'Category', 'Date', 'Notes'],
    preview: {
      tasks: ['Monthly budget', 'Investment review', 'Bill payments'],
      color: 'bg-brand-gradient'
    },
    popular: false
  },
  {
    id: 'development',
    title: 'Development',
    description: 'Track coding projects, sprints, and technical tasks.',
    icon: FiCode,
    color: 'spark',
    category: 'Development',
    fields: ['Feature', 'Sprint', 'Status', 'Due Date', 'Tech Stack'],
    preview: {
      tasks: ['API integration', 'Bug fixes', 'Code review'],
      color: 'bg-spark-gradient'
    },
    popular: false
  },
  {
    id: 'learning',
    title: 'Learning',
    description: 'Organize courses, study plans, and educational goals.',
    icon: FiBook,
    color: 'brand',
    category: 'Education',
    fields: ['Course', 'Topic', 'Progress', 'Deadline', 'Resources'],
    preview: {
      tasks: ['React course', 'Read chapter 5', 'Practice exercises'],
      color: 'bg-brand-gradient'
    },
    popular: false
  },
  {
    id: 'shopping',
    title: 'Shopping List',
    description: 'Create and manage shopping lists for groceries and essentials.',
    icon: FiShoppingCart,
    color: 'spark',
    category: 'Shopping',
    fields: ['Item', 'Category', 'Quantity', 'Store', 'Priority'],
    preview: {
      tasks: ['Milk', 'Bread', 'Eggs', 'Fruits'],
      color: 'bg-spark-gradient'
    },
    popular: false
  },
  {
    id: 'home',
    title: 'Home Management',
    description: 'Track home maintenance, cleaning schedules, and household tasks.',
    icon: FiHome,
    color: 'brand',
    category: 'Home',
    fields: ['Task', 'Room', 'Frequency', 'Due Date', 'Notes'],
    preview: {
      tasks: ['Deep clean', 'Garden maintenance', 'Appliance check'],
      color: 'bg-brand-gradient'
    },
    popular: false
  },
  {
    id: 'creative',
    title: 'Creative Projects',
    description: 'Manage creative projects, ideas, and artistic endeavors.',
    icon: FiCamera,
    color: 'spark',
    category: 'Creative',
    fields: ['Project', 'Type', 'Deadline', 'Inspiration', 'Status'],
    preview: {
      tasks: ['Photo shoot', 'Design mockup', 'Video edit'],
      color: 'bg-spark-gradient'
    },
    popular: false
  },
  {
    id: 'music',
    title: 'Music Practice',
    description: 'Track practice sessions, songs, and musical progress.',
    icon: FiMusic,
    color: 'brand',
    category: 'Music',
    fields: ['Song', 'Instrument', 'Duration', 'Difficulty', 'Notes'],
    preview: {
      tasks: ['Practice scales', 'Learn new song', 'Record demo'],
      color: 'bg-brand-gradient'
    },
    popular: false
  },
  {
    id: 'quick',
    title: 'Quick Tasks',
    description: 'Simple template for fast task creation and quick captures.',
    icon: FiZap,
    color: 'spark',
    category: 'Quick',
    fields: ['Task', 'Priority'],
    preview: {
      tasks: ['Quick note', 'Urgent task', 'Reminder'],
      color: 'bg-spark-gradient'
    },
    popular: true
  }
];

export const categories = ['All', 'Personal', 'Work', 'Health', 'Goals', 'Finance', 'Development', 'Education', 'Shopping', 'Home', 'Creative', 'Music', 'Quick'];
