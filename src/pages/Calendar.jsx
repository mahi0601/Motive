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
        className="bg-[#f5f6f8] min-h-screen w-full px-6 py-10 font-[Inter]"
      >
        <div className="max-w-6xl mx-auto bg-white border border-gray-200 shadow-xl rounded-2xl px-10 py-8">
          <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight mb-6 flex items-center gap-2 hover:text-indigo-500 transition-colors">
            📅 Calendar View
          </h2>

          {/* Calendar Component */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <CalendarView />
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Calendar;
