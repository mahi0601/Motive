import React from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../layout/DashboardLayout';
import CalendarView from '../components/CalendarView';

const Calendar = () => {
  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="mx-auto max-w-6xl px-2 py-6"
      >
        <CalendarView />
      </motion.div>
    </DashboardLayout>
  );
};

export default Calendar;
