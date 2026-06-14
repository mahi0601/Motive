import React from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { useTheme } from '../context/ThemeContext';

const Header = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 70 }}
      className="w-full px-6 py-4 bg-[#f9f9f9] dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 shadow-sm flex justify-between items-center z-40 font-inter"
    >
     
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Link to="/" className="transition-transform duration-300 hover:scale-[1.03] inline-block">
          <Logo size={30} />
        </Link>
      </motion.div>

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
          onClick={toggleTheme}
          className="ml-1 p-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-300"
          title="Toggle Theme"
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-spark-400 transition-transform duration-300" />
          ) : (
            <Moon className="w-5 h-5 text-gray-800 dark:text-gray-100 transition-transform duration-300" />
          )}
        </motion.button>
      </motion.nav>
    </motion.header>
  );
};

export default Header;
