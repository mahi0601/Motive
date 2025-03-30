
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckSquare, FiArrowRight, FiSearch, FiFolderPlus } from 'react-icons/fi';

const templates = [
  {
    title: 'Personal',
    description: 'Organize your personal to-dos, errands, and habits in one clean view.',
    link: '/login',
  },
  {
    title: 'Team Projects',
    description: 'Collaborate with your team, assign priorities, and manage progress.',
    link: '/login',
  },
  {
    title: 'Health & Wellness',
    description: 'Track your fitness, meals, and self-care routines effortlessly.',
    link: '/login',
  },
  {
    title: 'Finance ',
    description: 'Budget, track expenses, and build smarter saving habits.',
    link: '/login',
  },
];

const Home = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-[#f9f9f9] dark:bg-[#0d0d0d] text-gray-800 dark:text-gray-100 px-6 py-12 font-inter"
    >
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header Section */}
        <div className="text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex justify-center items-center gap-3"
          >
            <FiCheckSquare className="text-6xl text-indigo-500 animate-bounce" />
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-600 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300">
              Motive<span className="text-gray-300">.</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
          >
            A calm space to think, plan, and get things done — beautifully.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex justify-center gap-4 flex-wrap mt-4"
          >
            <Link
              to="/login"
              className="px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 text-sm font-medium shadow-sm hover:shadow-lg"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold transition duration-300 text-sm flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              Get Started <FiArrowRight />
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="relative max-w-xl mx-auto"
        >
          <FiSearch className="absolute top-3.5 left-4 text-gray-400 text-base" />
          <input
            type="text"
            placeholder="Search templates or ideas..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {templates.map((template, index) => (
            <Link
              key={index}
              to={template.link}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow hover:shadow-xl hover:ring-1 hover:ring-indigo-500 transition-all duration-300 flex flex-col gap-3 group"
            >
              <div className="flex items-center gap-3">
                <FiFolderPlus className="text-indigo-500 text-lg group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{template.title}</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {template.description}
              </p>
              <span className="mt-auto text-sm text-indigo-600 group-hover:underline dark:text-indigo-400">
                Explore →
              </span>
            </Link>
          ))}
        </motion.div>

        {/* Quote Footer */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-sm text-gray-500 dark:text-gray-400 italic text-center pt-12"
        >
          “Productivity is never an accident. It is always the result of intelligent planning, effort, and consistency.”
        </motion.p>
      </div>
    </motion.div>
  );
};

export default Home;

