import React from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { motion } from 'framer-motion';

const DashboardLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-[#121212] transition-colors duration-300">
      <Sidebar />

      <div className="flex flex-col flex-grow">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Header />
        </motion.div>

        <motion.main
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="p-6 overflow-y-auto flex-grow bg-gray-50 dark:bg-[#1c1c1c] rounded-t-2xl shadow-inner transition-all duration-300"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
};

export default DashboardLayout;