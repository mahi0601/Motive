// TimePickerModal.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';

const TimePickerModal = ({ task, onClose, onConfirm }) => {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const handleConfirm = () => {
    if (!date || !startTime || !endTime) return alert("Please fill all fields.");

    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);

    if (end <= start) return alert("End time must be after start time.");

    onConfirm(start, end);
    alert('✅ Task successfully added to Google Calendar!');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-light-surface dark:bg-dark-raised rounded-xl p-6 shadow-md w-full max-w-sm font-[Inter]"
      >
        <h2 className="text-lg font-medium text-light-text dark:text-white mb-6 text-center">
          Add <span className="font-semibold">"{task.title}"</span> to Calendar
        </h2>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-light-muted dark:text-dark-text mb-1">Select Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-surface dark:bg-dark-surface text-light-text dark:text-white"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-light-muted dark:text-dark-text mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-surface dark:bg-dark-surface text-light-text dark:text-white"
              />
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-light-muted dark:text-dark-text mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-surface dark:bg-dark-surface text-light-text dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-light-border/40 dark:bg-dark-surface text-light-text dark:text-dark-text rounded-lg hover:bg-light-border dark:hover:bg-dark-border"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700"
          >
            Add to Calendar
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default TimePickerModal;
