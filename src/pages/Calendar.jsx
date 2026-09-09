import React from 'react';
import { motion } from 'framer-motion';
import CalendarView from '../components/calendar/CalendarView';

const Calendar = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="mx-auto max-w-6xl px-2 py-6"
    >
      <CalendarView />
    </motion.div>
  );
};

export default Calendar;
