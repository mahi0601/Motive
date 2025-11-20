import React, { useEffect, useState } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import TaskAnalytics from '../components/TaskAnalytics';
import ProgressRing from '../components/ProgressRing';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line, AreaChart, Area, CartesianGrid
} from 'recharts';
import { FiBarChart2, FiPieChart, FiTrendingUp, FiTrendingDown, FiCalendar, FiClock, FiTarget, FiAward } from 'react-icons/fi';
import axios from 'axios';

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#c084fc'];

const Statistics = () => {
  const [taskData, setTaskData] = useState([]);
  const [priorityData, setPriorityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    }
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { taskStats, priorityStats } = res.data;

      setTaskData(taskStats || []);
      setPriorityData(priorityStats || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const totalTasks = priorityData.reduce((acc, item) => acc + item.value, 0);
  const completedTasks = tasks.filter(t => t.completed || t.status === 'completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const avgCompletionTime = 2.5;
  const streakDays = 7;

  const statsCards = [
    {
      label: 'Total Tasks',
      value: totalTasks,
      icon: <FiTarget className="w-6 h-6" />,
      color: 'indigo',
      trend: '+12%',
      trendUp: true
    },
    {
      label: 'Completed',
      value: completedTasks,
      icon: <FiAward className="w-6 h-6" />,
      color: 'indigo',
      trend: '+8%',
      trendUp: true
    },
    {
      label: 'Completion Rate',
      value: `${completionRate}%`,
      icon: <FiTrendingUp className="w-6 h-6" />,
      color: 'purple',
      trend: '+5%',
      trendUp: true
    },
    {
      label: 'Current Streak',
      value: `${streakDays} days`,
      icon: <FiCalendar className="w-6 h-6" />,
      color: 'indigo',
      trend: '+2 days',
      trendUp: true
    }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-800 dark:text-white mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#f9f9f9] dark:bg-[#0d0d0d] px-6 py-10 font-[Inter]">
        <div className="max-w-7xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6"
          >
            <div>
              <h2 className="text-4xl font-extrabold text-gray-800 dark:text-white mb-2 flex items-center gap-3 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300">
                <FiTrendingUp className="text-indigo-500" /> Statistics & Insights
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Track your productivity and task completion trends</p>
            </div>
            <div className="flex gap-2">
              {['week', 'month', 'year'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    timeRange === range
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-500'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </motion.div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <>
              <TaskAnalytics tasks={tasks} />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsCards.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -4 }}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-md hover:shadow-xl hover:ring-1 hover:ring-indigo-500 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-lg ${
                        stat.color === 'indigo' 
                          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                          : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                      }`}>
                        {stat.icon}
                      </div>
                      <div className={`flex items-center gap-1 text-xs font-medium ${
                        stat.trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {stat.trendUp ? <FiTrendingUp /> : <FiTrendingDown />}
                        {stat.trend}
                      </div>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-gray-800 dark:text-white mb-1">{stat.value}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-md hover:shadow-xl hover:ring-1 hover:ring-indigo-500 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                      <FiBarChart2 className="text-indigo-500" /> Tasks Completed This Week
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <FiClock className="w-4 h-4" />
                      Last 7 days
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={taskData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#6b7280"
                        className="dark:stroke-gray-400"
                        tick={{ fill: '#6b7280' }}
                      />
                      <YAxis 
                        stroke="#6b7280"
                        className="dark:stroke-gray-400"
                        tick={{ fill: '#6b7280' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="completed" 
                        fill="url(#colorGradient)" 
                        radius={[8, 8, 0, 0]}
                      >
                        {taskData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.8} />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-md hover:shadow-xl hover:ring-1 hover:ring-indigo-500 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                      <FiPieChart className="text-indigo-500" /> Priority Distribution
                    </h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {totalTasks} tasks
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={priorityData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {priorityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Overall Progress</h3>
                    <ProgressRing progress={completionRate} size={80} color="indigo" textColor="white" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-white/90 text-sm">
                      <span>Completion Rate</span>
                      <span className="font-bold">{completionRate}%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${completionRate}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="bg-white h-2 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-md hover:shadow-xl hover:ring-1 hover:ring-indigo-500 transition-all duration-300"
                >
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <FiClock className="text-indigo-500" /> Average Completion
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span>Time per task</span>
                        <span className="font-semibold text-gray-800 dark:text-white">{avgCompletionTime} days</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '65%' }} />
                      </div>
                    </div>
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Based on your last 30 tasks
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-md hover:shadow-xl hover:ring-1 hover:ring-indigo-500 transition-all duration-300"
                >
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <FiAward className="text-indigo-500" /> Achievements
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                      <div className="p-2 bg-indigo-600 rounded-lg">
                        <FiAward className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-white">7 Day Streak</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Keep it up!</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="p-2 bg-purple-600 rounded-lg">
                        <FiTarget className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-white">Task Master</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{completedTasks} tasks completed</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Statistics;
