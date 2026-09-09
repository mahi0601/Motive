import React, { useEffect, useState } from 'react';
import ProgressRing from '../components/ui/ProgressRing';
import ProductivityScore from '../components/app/ProductivityScore';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
} from 'recharts';
import { Award, BarChart2, Clock, Target, TrendingUp, Zap } from 'lucide-react';
import { getAllTasks } from '../services/taskService';
import { getStats } from '../services/statsService';
import { useTheme } from '../context/ThemeContext';
import { CHART_PRIMARY, SPARK, BRAND, chartAxisColor, chartGridColor } from '../utils/chartColors';

// Priority pie was dropped in favor of a compact inline legend (see below) —
// keeps the priority breakdown visible without a second chart card.
const PRIORITY_HEX = { High: SPARK[500], Medium: BRAND[500], Low: '#9C99A8' };

const Statistics = () => {
  const { isDark } = useTheme();
  const [taskData, setTaskData] = useState([]);
  const [priorityData, setPriorityData] = useState([]);
  const [taskCounts, setTaskCounts] = useState({ total: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        // Full list, not a single capped page — streaks/avgCompletionTime
        // below need every task, not just the first 100 (see
        // taskService.js#getAllTasks).
        setTasks(await getAllTasks());
      } catch (err) {
        console.error('Error loading tasks:', err);
      }
    })();
  }, []);

  const fetchStats = async () => {
    try {
      // `range` is honored server-side now — previously the Week/Month/Year
      // buttons changed this component's state but the request never
      // carried it.
      const res = await getStats(timeRange);
      const { taskStats, priorityStats, taskCounts: counts } = res.data;

      setTaskData(taskStats || []);
      setPriorityData(priorityStats || []);
      setTaskCounts(counts || { total: 0, completed: 0 });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  // Both counts now come from the same server-side, uncapped source — previously
  // `completedTasks` came from a 200-item-capped task list while `totalTasks`
  // came from an uncapped priority breakdown, so the rate could exceed 100%.
  const { total: totalTasks, completed: completedTasks } = taskCounts;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const doneTasks = tasks.filter((t) => t.status === 'done');
  // `completedAt` (added alongside the stats fixes) is the real completion
  // moment; `updatedAt` falls back only for tasks completed before that
  // field existed.
  const avgCompletionTime = doneTasks.length
    ? (
        doneTasks.reduce((sum, t) => sum + (new Date(t.completedAt || t.updatedAt) - new Date(t.createdAt)), 0) /
        doneTasks.length /
        (1000 * 60 * 60 * 24)
      ).toFixed(1)
    : null;

  const dayKey = (d) => new Date(d).toDateString();
  const completedDays = new Set(doneTasks.map((t) => dayKey(t.completedAt || t.updatedAt)));
  let streakDays = 0;
  for (let d = new Date(); ; d.setDate(d.getDate() - 1)) {
    if (!completedDays.has(dayKey(d))) break;
    streakDays += 1;
  }

  // ProductivityScore expects a `completed` boolean (mirrors Dashboard.jsx's
  // own `toView` mapping of the same raw task shape).
  const scoreTasks = tasks.map((t) => ({ ...t, completed: t.status === 'done' }));

  // Highlight the single best day in the weekly bar chart with the spark
  // accent instead of cycling through an arbitrary rainbow of hex values.
  const peakIndex = taskData.reduce(
    (best, entry, i) => (entry.completed > (taskData[best]?.completed ?? -1) ? i : best),
    0
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-light-surface dark:bg-dark-raised p-3 rounded-lg shadow-lg border border-light-border dark:border-dark-border">
          <p className="text-sm font-semibold text-light-text dark:text-dark-text mb-1">{label}</p>
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
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h2 className="text-3xl font-extrabold text-light-text dark:text-dark-text mb-1 flex items-center gap-3">
              <TrendingUp className="text-brand-500" /> Statistics & Insights
            </h2>
            <p className="text-light-muted dark:text-dark-muted">Track your productivity and task completion trends</p>
          </div>
          <div className="flex gap-2">
            {['week', 'month', 'year'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeRange === range
                    ? 'bg-brand-gradient text-white shadow-brand-sm'
                    : 'bg-light-surface dark:bg-dark-raised border border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted hover:border-brand-500'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
          </div>
        ) : (
          <>
            {/* Hero stats — 3 large tiles instead of the previous 5 stat
                cards + 4 TaskAnalytics tiles + 1 gradient progress card
                (completion rate used to be shown 3 separate times). */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-light-surface dark:bg-dark-raised rounded-xl border border-light-border dark:border-dark-border p-6"
              >
                <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-3">
                  <Target className="w-4.5 h-4.5" />
                </div>
                <p className="text-3xl font-bold text-light-text dark:text-dark-text leading-none">{totalTasks}</p>
                <p className="text-sm text-light-muted dark:text-dark-muted mt-2">total tasks</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-light-surface dark:bg-dark-raised rounded-xl border border-light-border dark:border-dark-border p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-3">
                    <TrendingUp className="w-4.5 h-4.5" />
                  </div>
                  <ProgressRing progress={completionRate} size={40} strokeWidth={4} color="brand" />
                </div>
                <p className="text-3xl font-bold text-light-text dark:text-dark-text leading-none">{completionRate}%</p>
                <p className="text-sm text-light-muted dark:text-dark-muted mt-2">completion rate</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-light-surface dark:bg-dark-raised rounded-xl border border-light-border dark:border-dark-border p-6"
              >
                <div className="w-9 h-9 rounded-lg bg-spark-50 dark:bg-spark-900/20 flex items-center justify-center text-spark-600 dark:text-spark-400 mb-3">
                  <Zap className="w-4.5 h-4.5" />
                </div>
                <p className="text-3xl font-bold text-light-text dark:text-dark-text leading-none">
                  {streakDays} day{streakDays === 1 ? '' : 's'}
                </p>
                <p className="text-sm text-light-muted dark:text-dark-muted mt-2">current streak</p>
              </motion.div>
            </div>

            <ProductivityScore tasks={scoreTasks} />

            {/* Single chart + a compact priority legend, instead of a
                second full chart card. */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-light-surface dark:bg-dark-raised rounded-xl border border-light-border dark:border-dark-border p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <h3 className="text-lg font-semibold text-light-text dark:text-dark-text flex items-center gap-2">
                  <BarChart2 className="text-brand-500" /> Tasks completed this {timeRange}
                </h3>
                <div className="flex items-center gap-4 text-sm text-light-muted dark:text-dark-muted">
                  {avgCompletionTime != null && (
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {avgCompletionTime}d avg. to complete</span>
                  )}
                  {priorityData.length > 0 && (
                    <span className="flex items-center gap-3">
                      {priorityData.map((p) => (
                        <span key={p.name} className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PRIORITY_HEX[p.name] || BRAND[500] }} />
                          {p.name} {p.value}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={taskData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor(isDark)} />
                  <XAxis dataKey="name" stroke={chartAxisColor(isDark)} tick={{ fill: chartAxisColor(isDark) }} />
                  <YAxis stroke={chartAxisColor(isDark)} tick={{ fill: chartAxisColor(isDark) }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="completed" radius={[8, 8, 0, 0]}>
                    {taskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === peakIndex ? SPARK[500] : CHART_PRIMARY} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Achievements — a plain list, not a grid of boxed cards. */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-light-surface dark:bg-dark-raised rounded-xl border border-light-border dark:border-dark-border p-6"
            >
              <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-4 flex items-center gap-2">
                <Award className="text-brand-500" /> Achievements
              </h3>
              <div className="divide-y divide-light-border dark:divide-dark-border">
                <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="w-9 h-9 rounded-lg bg-spark-50 dark:bg-spark-900/20 flex items-center justify-center text-spark-600 dark:text-spark-400 flex-shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-light-text dark:text-dark-text">
                      {streakDays} day{streakDays === 1 ? '' : 's'} streak
                    </p>
                    <p className="text-xs text-light-muted dark:text-dark-muted">Keep it up!</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-brand-600 dark:text-brand-400 flex-shrink-0">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-light-text dark:text-dark-text">Task Master</p>
                    <p className="text-xs text-light-muted dark:text-dark-muted">{completedTasks} tasks completed</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
  );
};

export default Statistics;
