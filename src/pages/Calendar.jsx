import React from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import CalendarView from '../components/CalendarView';
import { motion } from 'framer-motion';

const Calendar = () => {
  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="bg-[#f9f9f9] dark:bg-[#0d0d0d] min-h-screen w-full px-6 py-10 font-[Inter]"
      >
        <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl hover:shadow-2xl hover:ring-1 hover:ring-indigo-500 transition-all duration-300 rounded-2xl px-10 py-8">
          <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight mb-6 flex items-center gap-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300">
            📅 Calendar View
          </h2>

          {/* Calendar Component */}
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:ring-1 hover:ring-indigo-500 transition-all duration-300">
            <CalendarView />
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Calendar;
