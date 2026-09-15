import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, CalendarClock } from 'lucide-react';

const AT_RISK_WINDOW_MS = 48 * 60 * 60 * 1000;

// Was a 4-tile grid (Total/Completed/Pending/Overdue) plus a fifth
// gradient "Completion Rate" bar — the third of three places that number
// was shown across the app (see PLAN §3). Reduced to the two numbers that
// are actually decisions, not database statistics: what's due today, and
// what's at risk of being late. The full breakdown — with period-over-period
// deltas — lives on /momentum now.
const TaskAnalytics = ({ tasks = [] }) => {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const dueToday = tasks.filter((t) => {
    if (!t.dueDate || t.completed) return false;
    const d = new Date(t.dueDate);
    return d >= startOfToday && d < endOfToday;
  }).length;

  // Deliberately broader than /momentum's "At risk" tile, which strictly
  // means "due soon but not yet overdue" (its own separate tile is
  // "Overdue") — verified to disagree with that narrower definition on any
  // account carrying both overdue and due-soon work. Named "Needs
  // attention" instead of "At risk" for exactly that reason: two different
  // numbers under the same label, visible on pages a user will compare
  // directly, is the "completion rate shown three times" bug this whole
  // pass exists to kill (see PLAN §3).
  const needsAttention = tasks.filter((t) => {
    if (!t.dueDate || t.completed) return false;
    const d = new Date(t.dueDate);
    return d < now || d.getTime() - now.getTime() <= AT_RISK_WINDOW_MS;
  }).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-light-border bg-light-surface px-5 py-3 text-sm dark:border-dark-border dark:bg-dark-raised"
    >
      <span className="flex items-center gap-2 text-light-text dark:text-dark-text">
        <CalendarClock className="h-4 w-4 text-brand-500" />
        <strong className="font-semibold">{dueToday}</strong> due today
      </span>
      <span className="h-4 w-px bg-light-border dark:bg-dark-border" aria-hidden="true" />
      <span className="flex items-center gap-2 text-light-text dark:text-dark-text">
        <AlertTriangle className="h-4 w-4 text-spark-500" />
        <strong className="font-semibold">{needsAttention}</strong> needs attention
      </span>
      <Link to="/momentum" className="ml-auto text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">
        View Momentum →
      </Link>
    </motion.div>
  );
};

export default TaskAnalytics;
