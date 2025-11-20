import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlay, FiPause, FiSquare } from 'react-icons/fi';

const TaskTimer = ({ taskId, onTimeUpdate }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [savedTime, setSavedTime] = useState(() => {
    const stored = localStorage.getItem(`timer_${taskId}`);
    return stored ? parseInt(stored) : 0;
  });

  useEffect(() => {
    setTime(savedTime);
  }, [savedTime]);

  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setTime(prevTime => {
          const newTime = prevTime + 1;
          localStorage.setItem(`timer_${taskId}`, newTime.toString());
          if (onTimeUpdate) onTimeUpdate(newTime);
          return newTime;
        });
      }, 1000);
    } else if (!isRunning && time !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning, time, taskId, onTimeUpdate]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    setTime(0);
    setSavedTime(0);
    setIsRunning(false);
    localStorage.removeItem(`timer_${taskId}`);
    if (onTimeUpdate) onTimeUpdate(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
    >
      <span className="text-sm font-mono text-gray-700 dark:text-gray-300 min-w-[80px]">
        {formatTime(time)}
      </span>
      <div className="flex gap-1">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`p-1.5 rounded transition-colors ${
            isRunning
              ? 'bg-purple-500 hover:bg-purple-600 text-white'
              : 'bg-indigo-500 hover:bg-indigo-600 text-white'
          }`}
        >
          {isRunning ? <FiPause className="w-3 h-3" /> : <FiPlay className="w-3 h-3" />}
        </button>
        <button
          onClick={handleReset}
          className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
        >
          <FiSquare className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
};

export default TaskTimer;

