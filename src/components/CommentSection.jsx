import React from 'react';
import { motion } from 'framer-motion';

const CommentsSection = ({ comments = [] }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-6 bg-white dark:bg-[#2a2a2a] p-5 rounded-2xl shadow-md border border-gray-200 dark:border-[#3a3a3a]"
    >
      <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
        💬 Comments
      </h4>

      {comments.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          No comments yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-sm text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-[#1f1f1f] p-3 rounded-lg border border-gray-200 dark:border-[#3a3a3a] shadow-sm"
            >
              {c}
            </motion.li>
          ))}
        </ul>
      )}
    </motion.div>
  );
};

export default CommentsSection;
