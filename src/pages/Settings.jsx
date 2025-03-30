import React, { useEffect, useState } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { motion } from 'framer-motion';
import { FiSettings, FiMoon, FiBell, FiLogOut, FiMail, FiUser } from 'react-icons/fi';
import { Menu } from '@headlessui/react';
import { Link, useNavigate } from 'react-router-dom';

const Settings = () => {
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const handleToggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleEmailAlert = () => {
    alert('📩 Email notifications enabled successfully!');
  };

  return (
    <DashboardLayout>
      <div className="flex justify-end px-4">
        <Menu as="div" className="relative inline-block text-left z-50">
          <Menu.Button className="rounded-full w-10 h-10 bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition duration-300 shadow-md">
            {user ? (
              <div className="w-full h-full rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
            ) : (
              <FiUser className="text-xl" />
            )}
          </Menu.Button>
          <Menu.Items className="absolute right-0 mt-2 w-44 bg-white dark:bg-[#2b2b2b] border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl py-1 text-sm">
            <Menu.Item>
              {({ active }) => (
                <Link
                  to="/profile"
                  className={`block px-4 py-2 transition duration-300 rounded-md ${
                    active
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-800 dark:text-white'
                      : 'text-gray-800 dark:text-gray-100'
                  } hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-800 dark:hover:text-white`}
                >
                  Profile
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
  {({ active }) => (
    <button
      onClick={handleLogout}
      className={`w-full text-left px-4 py-2 rounded-md font-medium transition duration-300 
        bg-gray-100 dark:bg-gray-700 
        text-indigo-600 dark:text-indigo-300 
        hover:bg-indigo-350 hover:text-indigo-700 
        dark:hover:bg-indigo-800 dark:hover:text-white`}
    >
      Logout
    </button>
  )}
</Menu.Item>

          </Menu.Items>
        </Menu>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-[#f9f9f9] dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 font-inter"
      >
        <h2 className="text-3xl font-extrabold tracking-tight mb-6 flex items-center gap-3 text-gray-800 dark:text-gray-100 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors duration-300">
          <FiSettings className="text-indigo-500 animate-spin-slow" />
          Settings
        </h2>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
          Customize your experience. Adjust settings such as themes, notifications, and account preferences.
        </p>

        <div className="space-y-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-5 bg-white dark:bg-[#2b2b2b] border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-500 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiMoon className="text-indigo-500" />
                <h4 className="text-lg font-semibold">Theme Settings</h4>
              </div>
              <div
                className={`relative w-14 h-7 flex items-center bg-gray-300 dark:bg-gray-700 rounded-full p-1 cursor-pointer transition`}
                onClick={handleToggleTheme}
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
                    isDarkMode ? 'translate-x-7' : ''
                  }`}
                />
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Toggle between Light and Dark mode.</p>
          </motion.div>

          {/* Notifications */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-5 bg-white dark:bg-[#2b2b2b] border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-500 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiBell className="text-indigo-500" />
                <h4 className="text-lg font-semibold">Notifications</h4>
              </div>
              <button
                onClick={handleEmailAlert}
                className="px-4 py-2 text-sm rounded-lg font-medium bg-white dark:bg-transparent text-indigo-600 border border-indigo-600 hover:bg-indigo-600 hover:text-white transition dark:text-white dark:border-white"
              >
                <FiMail className="inline-block mr-1" /> Enable Alerts
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Enable email alerts and notifications.</p>
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Settings;
