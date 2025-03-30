import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';

const StatsChart = ({ data }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200"
    >
      <h2 className="text-xl font-semibold text-gray-800 mb-4">📊 Weekly Task Completion</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          className="transition-all"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" className="text-sm fill-gray-600" />
          <YAxis className="text-sm fill-gray-600" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#f3f4f6',
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
              fontSize: '14px',
            }}
          />
          <Bar dataKey="completed" fill="#6366F1" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default StatsChart;
