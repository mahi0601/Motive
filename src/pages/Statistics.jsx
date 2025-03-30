import React, { useEffect, useState } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { FiBarChart2, FiPieChart, FiTrendingUp } from 'react-icons/fi';
import axios from 'axios';

const COLORS = ['#6366f1', '#60a5fa', '#fbbf24'];

const Statistics = () => {
  const [taskData, setTaskData] = useState([]);
  const [priorityData, setPriorityData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8080/api/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { taskStats, priorityStats } = res.data;

      setTaskData(taskStats);
      setPriorityData(priorityStats);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const totalTasks = priorityData.reduce((acc, item) => acc + item.value, 0);

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="bg-[#f6f6f6] dark:bg-[#1e1e1e] text-gray-800 dark:text-gray-200 p-6 rounded-2xl border border-gray-300 dark:border-gray-800 shadow-xl font-[Inter]"
      >
        <h2 className="text-3xl font-extrabold tracking-tight mb-6 flex items-center gap-3 text-gray-700 dark:text-white">
          <FiTrendingUp className="text-indigo-500" /> Insights
        </h2>

        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading statistics...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-5 bg-white dark:bg-[#2a2a2a] rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <h4 className="text-lg font-semibold text-gray-700 dark:text-indigo-400 mb-1">Total Tasks</h4>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{totalTasks}</p>
              </div>
              <div className="p-5 bg-white dark:bg-[#2a2a2a] rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <h4 className="text-lg font-semibold text-gray-700 dark:text-indigo-400 mb-1">High Priority</h4>
                <p className="text-xl font-semibold text-red-500">
                  {priorityData.find((p) => p.name === 'High')?.value || 0}
                </p>
              </div>
              <div className="p-5 bg-white dark:bg-[#2a2a2a] rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <h4 className="text-lg font-semibold text-gray-700 dark:text-indigo-400 mb-1">Low Priority</h4>
                <p className="text-xl font-semibold text-yellow-500">
                  {priorityData.find((p) => p.name === 'Low')?.value || 0}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-[#2a2a2a] p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700 dark:text-white">
                  <FiBarChart2 className="text-indigo-500" /> Tasks Completed This Week
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={taskData}>
                    <XAxis dataKey="name" stroke="#999" />
                    <YAxis stroke="#999" />
                    <Tooltip contentStyle={{ backgroundColor: '#1f1f1f', border: 'none', color: '#fff' }} />
                    <Bar dataKey="completed" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white dark:bg-[#2a2a2a] p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700 dark:text-white">
                  <FiPieChart className="text-indigo-500" /> Task Priority Distribution
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={priorityData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={80}
                      label
                    >
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1f1f1f', border: 'none', color: '#fff' }} />
                    <Legend verticalAlign="bottom" iconType="circle" iconSize={10} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default Statistics;
