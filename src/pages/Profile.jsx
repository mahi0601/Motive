import React, { useEffect, useState } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLogOut, FiArrowLeft, FiClock } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loginTime, setLoginTime] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const loginTimestamp = localStorage.getItem('loginTime');
    if (storedUser) setUser(JSON.parse(storedUser));
    if (loginTimestamp) setLoginTime(new Date(loginTimestamp).toLocaleString());
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('loginTime');
    navigate('/');
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-[#f9f9f9] dark:bg-[#0d0d0d] text-gray-900 dark:text-gray-100 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 font-inter"
      >
        <div className="flex justify-between items-center mb-6">
          <motion.h2
            whileHover={{ scale: 1.02, color: '#6366f1' }}
            transition={{ duration: 0.3 }}
            className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-gray-800 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300"
          >
            <FiUser className="text-indigo-500" />
            Profile
          </motion.h2>

          <motion.button
            onClick={() => navigate(-1)}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 hover:text-white dark:hover:text-white transition-all duration-300"
          >
            <FiArrowLeft />
            Back
          </motion.button>
        </div>

        {/* Profile Info Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-6 bg-white dark:bg-[#2b2b2b] border border-gray-200 dark:border-gray-600 rounded-xl shadow-md hover:shadow-lg hover:ring-1 hover:ring-indigo-500 transition-all duration-300"
        >
          <div className="flex items-center gap-5 mb-3">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-2xl font-bold flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className="text-xl font-semibold">{user?.name || 'Unnamed User'}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <FiMail /> {user?.email || 'No email found'}
              </p>
              {loginTime && (
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1 flex items-center gap-2">
                  <FiClock /> Logged in since: {loginTime}
                </p>
              )}
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            🔔 <span className="font-medium">Tip:</span> Keep your profile up to date for the best experience.
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="mt-6 p-6 bg-white dark:bg-[#2b2b2b] border border-gray-200 dark:border-gray-600 rounded-xl shadow-md flex justify-between items-center"
        >
          <div className="flex items-center gap-3">
            <FiLogOut className="text-red-500" />
            <h4 className="text-lg font-medium text-red-600 dark:text-red-400">Logout</h4>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border border-red-400 hover:bg-red-200 dark:hover:bg-red-800 transition"
          >
            Confirm Logout
          </button>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Profile;
