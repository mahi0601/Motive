import React from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiAward, FiTarget } from 'react-icons/fi';
import ProgressRing from './ProgressRing';

const ProductivityScore = ({ tasks = [] }) => {
  const completed = tasks.filter(t => t.completed).length;
  const total = tasks.length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  const onTimeTasks = tasks.filter(t => {
    if (!t.dueDate || !t.completed) return false;
    return new Date(t.completedAt || Date.now()) <= new Date(t.dueDate);
  }).length;
  
  const onTimeRate = completed > 0 ? Math.round((onTimeTasks / completed) * 100) : 0;
  
  const highPriorityCompleted = tasks.filter(t => t.priority === 'High' && t.completed).length;
  const highPriorityTotal = tasks.filter(t => t.priority === 'High').length;
  const highPriorityRate = highPriorityTotal > 0 ? Math.round((highPriorityCompleted / highPriorityTotal) * 100) : 0;

  const productivityScore = Math.round(
    (completionRate * 0.4) + (onTimeRate * 0.3) + (highPriorityRate * 0.3)
  );

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-indigo-600 dark:text-indigo-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <FiAward className="w-6 h-6" />
            Productivity Score
          </h3>
          <p className="text-white/80 text-sm">Your overall performance metric</p>
        </div>
        <ProgressRing progress={productivityScore} size={100} color="indigo" textColor="white" />
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <FiTarget className="w-4 h-4 text-white/80" />
            <span className="text-xs text-white/80">Completion</span>
          </div>
          <p className="text-2xl font-bold text-white">{completionRate}%</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <FiTrendingUp className="w-4 h-4 text-white/80" />
            <span className="text-xs text-white/80">On Time</span>
          </div>
          <p className="text-2xl font-bold text-white">{onTimeRate}%</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <FiAward className="w-4 h-4 text-white/80" />
            <span className="text-xs text-white/80">Priority</span>
          </div>
          <p className="text-2xl font-bold text-white">{highPriorityRate}%</p>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-white/20">
        <div className="flex items-center justify-between">
          <span className="text-white/90 font-medium">Overall Score</span>
          <div className="text-right">
            <p className={`text-3xl font-bold ${getScoreColor(productivityScore)}`}>
              {productivityScore}
            </p>
            <p className="text-sm text-white/80">{getScoreLabel(productivityScore)}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductivityScore;

