import React from 'react';
import { motion } from 'framer-motion';

const ProgressRing = ({ progress, size = 60, strokeWidth = 6, color = 'brand', textColor = 'default' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const colorClasses = {
    brand: 'text-brand-600 dark:text-brand-400',
    spark: 'text-spark-600 dark:text-spark-400',
  };

  const textColorClasses = {
    default: colorClasses[color] || colorClasses.brand,
    white: 'text-white',
  };

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className={textColor === 'white' ? 'text-white/20' : 'text-light-border dark:text-dark-border'}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={textColor === 'white' ? 'text-white' : (colorClasses[color] || colorClasses.brand)}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-xs font-bold ${textColorClasses[textColor] || textColorClasses.default}`}>
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
};

export default ProgressRing;

