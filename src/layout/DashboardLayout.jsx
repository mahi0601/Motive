import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { motion } from 'framer-motion';

// A layout ROUTE (see routes/AppRoutes.jsx) — renders the shared shell once
// and an <Outlet/> for whichever protected page matched, instead of every
// page individually importing and wrapping itself in <DashboardLayout>.
const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background transition-colors duration-300">
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
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
};

export default DashboardLayout;
