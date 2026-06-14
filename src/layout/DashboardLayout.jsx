import React from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { motion } from 'framer-motion';

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0e0d12] transition-colors duration-300">
      <Sidebar />

      {/* Offset for the persistent sidebar on desktop; full width on mobile. */}
      <div className="flex min-h-screen flex-col lg:ml-64">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Header />
        </motion.div>

        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="flex-grow overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-6 sm:pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
};

export default DashboardLayout;
