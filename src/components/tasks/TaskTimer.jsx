import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Pause, Play, Square } from 'lucide-react';

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
      className="flex items-center gap-2 p-2 bg-light-border/40 dark:bg-dark-raised rounded-lg"
    >
      <span className="text-sm font-mono text-light-text dark:text-dark-text min-w-[80px]">
        {formatTime(time)}
      </span>
      <div className="flex gap-1">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`p-1.5 rounded transition-colors ${
            isRunning
              ? 'bg-spark-500 hover:bg-spark-600 text-white'
              : 'bg-brand-500 hover:bg-brand-600 text-white'
          }`}
        >
          {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        </button>
        <button
          onClick={handleReset}
          className="p-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded transition-colors"
        >
          <Square className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
};

export default TaskTimer;

