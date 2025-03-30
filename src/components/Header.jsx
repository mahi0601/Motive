import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';

const Header = () => {
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme === 'dark';
    return window.matchMedia('(prefers-color-scheme: light)').matches ? false : true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 70 }}
      className="w-full px-6 py-4 bg-[#f9f9f9] dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 shadow-sm flex justify-between items-center z-40 font-inter"
    >
     
      <motion.h1
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-2xl font-extrabold tracking-tight flex items-center gap-2 group"
      >
        <span className="text-pink-500 group-hover:scale-110 transition-transform duration-300">📋</span>
        <span className="text-gray-900 dark:text-gray-100 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors duration-300">
          Motive
        </span>
      </motion.h1>

      <motion.nav
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="flex items-center gap-4"
      >

        <Link to="/login">
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 rounded-md text-sm border border-gray-300 bg-white text-gray-800 hover:text-indigo-600 hover:border-indigo-500 hover:shadow-lg dark:bg-[#2a2a2a] dark:text-gray-100 dark:border-gray-600 dark:hover:text-indigo-400 dark:hover:border-indigo-400 transition-all duration-300"
          >
            Login
          </motion.button>
        </Link>

        <Link to="/register">
          <motion.button
            whileHover={{ scale: 1.07, y: -2 }}
            whileTap={{ scale: 0.94 }}
            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl transition-all duration-300"
          >
            Sign Up
          </motion.button>
        </Link>

        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ rotate: 12 }}
          onClick={() => setDarkMode(!darkMode)}
          className="ml-1 p-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-300"
          title="Toggle Theme"
        >
          {darkMode ? (
            <Moon className="w-5 h-5 text-yellow-400 transition-transform duration-300" />
          ) : (
            <Sun className="w-5 h-5 text-gray-800 dark:text-gray-100 transition-transform duration-300" />
          )}
        </motion.button>
      </motion.nav>
    </motion.header>
  );
};

export default Header;
