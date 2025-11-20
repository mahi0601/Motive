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
    color: 'indigo',
    category: 'Personal',
    fields: ['Task Name', 'Due Date', 'Priority', 'Notes'],
    preview: {
      tasks: ['Morning workout', 'Grocery shopping', 'Call family'],
      color: 'from-indigo-500 to-indigo-600'
    },
    popular: true
  },
  {
    id: 'work',
    title: 'Work Tasks',
    description: 'Organize your work projects, deadlines, and team collaborations.',
    icon: FiBriefcase,
    color: 'purple',
    category: 'Work',
    fields: ['Project', 'Task', 'Status', 'Deadline', 'Assignee'],
    preview: {
      tasks: ['Q4 Planning', 'Client meeting', 'Code review'],
      color: 'from-purple-500 to-purple-600'
    },
    popular: true
  },
  {
    id: 'wellness',
    title: 'Health & Wellness',
    description: 'Track your workouts, meals, meditation, and health logs.',
    icon: FiHeart,
    color: 'indigo',
    category: 'Health',
    fields: ['Activity', 'Duration', 'Calories', 'Mood', 'Notes'],
    preview: {
      tasks: ['Morning run', 'Meal prep', 'Yoga session'],
      color: 'from-indigo-500 to-purple-500'
    },
    popular: false
  },
  {
    id: 'goals',
    title: 'Goal Tracker',
    description: 'Define long-term goals and break them down into actionable milestones.',
    icon: FiTarget,
    color: 'purple',
    category: 'Goals',
    fields: ['Goal', 'Milestones', 'Deadline', 'Progress', 'Reward'],
    preview: {
      tasks: ['Learn Spanish', 'Save $10k', 'Run marathon'],
      color: 'from-purple-500 to-indigo-500'
    },
    popular: true
  },
  {
    id: 'finance',
    title: 'Finance Tracker',
    description: 'Budget planning, expense tracking, and financial goal management.',
    icon: FiDollarSign,
    color: 'indigo',
    category: 'Finance',
    fields: ['Expense', 'Amount', 'Category', 'Date', 'Notes'],
    preview: {
      tasks: ['Monthly budget', 'Investment review', 'Bill payments'],
      color: 'from-indigo-600 to-purple-600'
    },
    popular: false
  },
  {
    id: 'development',
    title: 'Development',
    description: 'Track coding projects, sprints, and technical tasks.',
    icon: FiCode,
    color: 'purple',
    category: 'Development',
    fields: ['Feature', 'Sprint', 'Status', 'Due Date', 'Tech Stack'],
    preview: {
      tasks: ['API integration', 'Bug fixes', 'Code review'],
      color: 'from-purple-600 to-indigo-600'
    },
    popular: false
  },
  {
    id: 'learning',
    title: 'Learning',
    description: 'Organize courses, study plans, and educational goals.',
    icon: FiBook,
    color: 'indigo',
    category: 'Education',
    fields: ['Course', 'Topic', 'Progress', 'Deadline', 'Resources'],
    preview: {
      tasks: ['React course', 'Read chapter 5', 'Practice exercises'],
      color: 'from-indigo-500 to-purple-500'
    },
    popular: false
  },
  {
    id: 'shopping',
    title: 'Shopping List',
    description: 'Create and manage shopping lists for groceries and essentials.',
    icon: FiShoppingCart,
    color: 'purple',
    category: 'Shopping',
    fields: ['Item', 'Category', 'Quantity', 'Store', 'Priority'],
    preview: {
      tasks: ['Milk', 'Bread', 'Eggs', 'Fruits'],
      color: 'from-purple-500 to-indigo-500'
    },
    popular: false
  },
  {
    id: 'home',
    title: 'Home Management',
    description: 'Track home maintenance, cleaning schedules, and household tasks.',
    icon: FiHome,
    color: 'indigo',
    category: 'Home',
    fields: ['Task', 'Room', 'Frequency', 'Due Date', 'Notes'],
    preview: {
      tasks: ['Deep clean', 'Garden maintenance', 'Appliance check'],
      color: 'from-indigo-600 to-purple-600'
    },
    popular: false
  },
  {
    id: 'creative',
    title: 'Creative Projects',
    description: 'Manage creative projects, ideas, and artistic endeavors.',
    icon: FiCamera,
    color: 'purple',
    category: 'Creative',
    fields: ['Project', 'Type', 'Deadline', 'Inspiration', 'Status'],
    preview: {
      tasks: ['Photo shoot', 'Design mockup', 'Video edit'],
      color: 'from-purple-600 to-indigo-600'
    },
    popular: false
  },
  {
    id: 'music',
    title: 'Music Practice',
    description: 'Track practice sessions, songs, and musical progress.',
    icon: FiMusic,
    color: 'indigo',
    category: 'Music',
    fields: ['Song', 'Instrument', 'Duration', 'Difficulty', 'Notes'],
    preview: {
      tasks: ['Practice scales', 'Learn new song', 'Record demo'],
      color: 'from-indigo-500 to-purple-500'
    },
    popular: false
  },
  {
    id: 'quick',
    title: 'Quick Tasks',
    description: 'Simple template for fast task creation and quick captures.',
    icon: FiZap,
    color: 'purple',
    category: 'Quick',
    fields: ['Task', 'Priority'],
    preview: {
      tasks: ['Quick note', 'Urgent task', 'Reminder'],
      color: 'from-purple-500 to-indigo-500'
    },
    popular: true
  }
];

export const categories = ['All', 'Personal', 'Work', 'Health', 'Goals', 'Finance', 'Development', 'Education', 'Shopping', 'Home', 'Creative', 'Music', 'Quick'];
