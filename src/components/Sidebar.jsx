import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import {
  FiHome,
  FiCalendar,
  FiBarChart2,
  FiSettings,
  FiGrid, // ✅ Make sure this is imported
} from 'react-icons/fi';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <FiHome /> },
    { name: 'Calendar', path: '/calendar', icon: <FiCalendar /> },
    { name: 'Statistics', path: '/stats', icon: <FiBarChart2 /> },
    { name: 'Templates', path: '/templates', icon: <FiGrid /> }, 
    { name: 'Settings', path: '/settings', icon: <FiSettings /> },
  ];

  return (
    <>
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 transform transition-transform duration-300 ease-in-out
        bg-white dark:bg-[#1a1a1a] border-r border-gray-200 dark:border-gray-700 px-6 py-6 shadow-xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-2xl font-extrabold text-gray-800 dark:text-white hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors flex items-center gap-2">
            <span className="text-indigo-500 animate-pulse">
              <FiHome className="text-2xl" />
            </span>
            <span>Motive</span>
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 bg-gray-200 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-700 dark:hover:to-purple-700 rounded-md transition duration-300 shadow-sm hover:shadow-md"
            title="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ul className="space-y-3">
          {navItems.map((item, index) => (
            <li key={index}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300
                  hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-600 dark:hover:from-indigo-900/50 dark:hover:to-purple-900/50 dark:hover:bg-gray-700 dark:hover:text-indigo-400
                  ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 dark:from-indigo-700 dark:to-purple-700 dark:text-white shadow-md'
                      : 'text-gray-700 dark:text-gray-300'
                  }`
                }
              >
                {item.icon}
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </aside>

      {!isOpen && (
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={() => setIsOpen(true)}
            className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 text-indigo-700 dark:text-white border border-indigo-300 dark:border-indigo-700 p-2 rounded-lg shadow-md hover:shadow-lg hover:from-indigo-200 hover:to-purple-200 dark:hover:from-indigo-800 dark:hover:to-purple-800 transition-all duration-300"
            title="Open Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      )}
    </>
  );
};

export default Sidebar;
