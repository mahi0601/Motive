import React, { useEffect, useMemo, useState } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  subMonths,
  addMonths,
} from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Trash2, CalendarDays, Loader2 } from 'lucide-react';
import { getTasks, createTask, deleteTask } from '../services/taskService';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const PRIORITY = {
  High: { dot: 'bg-rose-500', chip: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' },
  Medium: { dot: 'bg-spark-500', chip: 'bg-spark-100 text-spark-700 dark:bg-spark-500/15 dark:text-spark-300' },
  Low: { dot: 'bg-brand-500', chip: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300' },
};

const dayKey = (d) => format(d, 'yyyy-MM-dd');

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ title: '', priority: 'Medium' });
  const [saving, setSaving] = useState(false);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const { data } = await getTasks({ limit: 200 });
      setTasks((data.items || []).filter((t) => t.dueDate));
    } catch (e) {
      console.error('Failed to load calendar tasks', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // Full 6-week grid so every month aligns to the weekday header.
  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const gridEnd = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentDate]);

  // Bucket tasks by yyyy-MM-dd for O(1) lookup per cell.
  const tasksByDay = useMemo(() => {
    const map = {};
    for (const t of tasks) {
      const key = dayKey(parseISO(t.dueDate));
      (map[key] ||= []).push(t);
    }
    return map;
  }, [tasks]);

  const selectedTasks = tasksByDay[dayKey(selected)] || [];

  const handleAdd = async (e) => {
    e.preventDefault();
    const title = draft.title.trim();
    if (!title) return;
    setSaving(true);
    try {
      const due = new Date(selected);
      due.setHours(12, 0, 0, 0); // noon avoids timezone day-shift
      const { data } = await createTask({ title, priority: draft.priority, dueDate: due.toISOString() });
      setTasks((prev) => [...prev, data.task]);
      setDraft({ title: '', priority: 'Medium' });
    } catch (err) {
      console.error('Failed to add event', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setTasks((prev) => prev.filter((t) => t._id !== id));
    await deleteTask(id).catch((e) => console.error(e));
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* ── Calendar ───────────────────────────────── */}
      <div className="flex-1">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
            {format(currentDate, 'MMMM')}{' '}
            <span className="text-gray-400">{format(currentDate, 'yyyy')}</span>
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentDate(new Date())}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:border-brand-400 hover:text-brand-600 dark:border-[#2A2733] dark:text-gray-300"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentDate((d) => subMonths(d, 1))}
              className="rounded-lg border border-gray-200 p-1.5 text-gray-500 transition hover:border-brand-400 hover:text-brand-600 dark:border-[#2A2733] dark:text-gray-300"
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setCurrentDate((d) => addMonths(d, 1))}
              className="rounded-lg border border-gray-200 p-1.5 text-gray-500 transition hover:border-brand-400 hover:text-brand-600 dark:border-[#2A2733] dark:text-gray-300"
              aria-label="Next month"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Weekday header */}
        <div className="mb-2 grid grid-cols-7 gap-1 sm:gap-1.5">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {days.map((day) => {
            const inMonth = isSameMonth(day, currentDate);
            const today = isToday(day);
            const isSelected = isSameDay(day, selected);
            const dayTasks = tasksByDay[dayKey(day)] || [];
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelected(day)}
                className={`group relative flex min-h-[58px] flex-col rounded-lg border p-1 text-left transition sm:min-h-[80px] sm:rounded-xl sm:p-1.5
                  ${isSelected ? 'border-brand-500 ring-2 ring-brand-500/30' : 'border-gray-200 dark:border-[#2A2733]'}
                  ${inMonth ? 'bg-white dark:bg-[#17151D]' : 'bg-gray-50/60 dark:bg-[#121016]'}
                  hover:border-brand-400`}
              >
                <span
                  className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold sm:text-xs
                    ${today ? 'bg-brand-gradient text-white' : inMonth ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-600'}`}
                >
                  {format(day, 'd')}
                </span>

                {/* Chips on sm+ */}
                <div className="hidden flex-col gap-1 overflow-hidden sm:flex">
                  {dayTasks.slice(0, 2).map((t) => (
                    <span
                      key={t._id}
                      className={`truncate rounded px-1.5 py-0.5 text-[10px] font-medium ${(PRIORITY[t.priority] || PRIORITY.Low).chip}`}
                    >
                      {t.title}
                    </span>
                  ))}
                  {dayTasks.length > 2 && (
                    <span className="px-1 text-[10px] font-medium text-gray-400">
                      +{dayTasks.length - 2} more
                    </span>
                  )}
                </div>

                {/* Dots on mobile */}
                {dayTasks.length > 0 && (
                  <div className="mt-auto flex flex-wrap gap-0.5 sm:hidden">
                    {dayTasks.slice(0, 4).map((t) => (
                      <span
                        key={t._id}
                        className={`h-1.5 w-1.5 rounded-full ${(PRIORITY[t.priority] || PRIORITY.Low).dot}`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Day panel ──────────────────────────────── */}
      <aside className="lg:w-80">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-[#2A2733] dark:bg-[#17151D]">
          <div className="mb-1 flex items-center gap-2 text-brand-500">
            <CalendarDays size={16} />
            <span className="text-xs font-semibold uppercase tracking-wide">
              {isToday(selected) ? 'Today' : format(selected, 'EEEE')}
            </span>
          </div>
          <h3 className="mb-4 font-display text-xl font-bold text-gray-900 dark:text-white">
            {format(selected, 'MMMM d, yyyy')}
          </h3>

          {/* Add event */}
          <form onSubmit={handleAdd} className="mb-4 space-y-2">
            <input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="Add an event…"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-[#2A2733] dark:bg-[#0e0d12] dark:text-white"
            />
            <div className="flex items-center gap-2">
              {['Low', 'Medium', 'High'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, priority: p }))}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition
                    ${draft.priority === p ? 'bg-gray-100 ring-1 ring-brand-400 dark:bg-white/10' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                >
                  <span className={`h-2 w-2 rounded-full ${PRIORITY[p].dot}`} /> {p}
                </button>
              ))}
              <button
                type="submit"
                disabled={saving || !draft.title.trim()}
                className="ml-auto flex items-center gap-1 rounded-lg bg-brand-gradient px-3 py-1.5 text-sm font-semibold text-white shadow-brand-sm transition hover:shadow-brand disabled:opacity-50"
              >
                <Plus size={14} /> Add
              </button>
            </div>
          </form>

          {/* Day's events */}
          {loading ? (
            <div className="flex justify-center py-8 text-gray-400">
              <Loader2 className="animate-spin" />
            </div>
          ) : selectedTasks.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">No events on this day.</p>
          ) : (
            <ul className="space-y-2">
              <AnimatePresence initial={false}>
                {selectedTasks.map((t) => (
                  <motion.li
                    key={t._id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="group flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-[#2A2733] dark:bg-[#0e0d12]"
                  >
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${(PRIORITY[t.priority] || PRIORITY.Low).dot}`} />
                    <span className="flex-1 truncate text-sm text-gray-800 dark:text-gray-100">{t.title}</span>
                    <button
                      onClick={() => handleDelete(t._id)}
                      className="text-gray-300 opacity-0 transition group-hover:opacity-100 hover:text-red-500"
                      aria-label="Delete event"
                    >
                      <Trash2 size={15} />
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
};

export default CalendarView;
