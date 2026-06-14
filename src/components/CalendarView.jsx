import React, { useEffect, useMemo, useState } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  isTomorrow,
  parseISO,
  subMonths,
  addMonths,
} from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Trash2, Loader2, LayoutGrid, List } from 'lucide-react';
import { getTasks, createTask, deleteTask } from '../services/taskService';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const PRIORITY = {
  High: 'bg-rose-500',
  Medium: 'bg-spark-500',
  Low: 'bg-brand-500',
};
const dotColor = (p) => PRIORITY[p] || PRIORITY.Low;

const dayKey = (d) => format(d, 'yyyy-MM-dd');
const groupLabel = (d) =>
  isToday(d) ? 'Today' : isTomorrow(d) ? 'Tomorrow' : format(d, 'EEEE, MMM d');

// ── Module-level subcomponents (stable identity → inputs keep focus) ──
const AddForm = ({ draft, setDraft, onSubmit, saving }) => (
  <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
    <input
      value={draft.title}
      onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
      placeholder="Add an event…"
      className="min-w-0 flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-[#2A2733] dark:bg-[#0e0d12] dark:text-white"
    />
    <div className="flex items-center gap-1">
      {['Low', 'Medium', 'High'].map((p) => (
        <button
          key={p}
          type="button"
          title={p}
          onClick={() => setDraft((d) => ({ ...d, priority: p }))}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
            draft.priority === p ? 'ring-2 ring-offset-1 ring-brand-400 dark:ring-offset-[#17151D]' : 'opacity-60 hover:opacity-100'
          }`}
        >
          <span className={`h-3 w-3 rounded-full ${dotColor(p)}`} />
        </button>
      ))}
    </div>
    <button
      type="submit"
      disabled={saving || !draft.title.trim()}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-white shadow-brand-sm transition hover:shadow-brand disabled:opacity-50"
      aria-label="Add event"
    >
      <Plus size={18} />
    </button>
  </form>
);

const EventRow = ({ t, onDelete }) => (
  <motion.li
    initial={{ opacity: 0, y: 4 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
    className="group flex items-center gap-3 py-2.5"
  >
    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotColor(t.priority)}`} />
    <span className="flex-1 truncate text-sm text-gray-800 dark:text-gray-100">{t.title}</span>
    <button
      onClick={() => onDelete(t._id)}
      className="text-gray-300 opacity-0 transition group-hover:opacity-100 hover:text-red-500"
      aria-label="Delete event"
    >
      <Trash2 size={15} />
    </button>
  </motion.li>
);

const CalendarView = () => {
  const [view, setView] = useState('month');
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

  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const gridEnd = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentDate]);

  const tasksByDay = useMemo(() => {
    const map = {};
    for (const t of tasks) {
      (map[dayKey(parseISO(t.dueDate))] ||= []).push(t);
    }
    return map;
  }, [tasks]);

  const agendaGroups = useMemo(() => {
    const today = startOfDay(new Date());
    const upcoming = tasks
      .filter((t) => parseISO(t.dueDate) >= today)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    const groups = [];
    let cur = null;
    for (const t of upcoming) {
      const key = dayKey(parseISO(t.dueDate));
      if (!cur || cur.key !== key) {
        cur = { key, date: parseISO(t.dueDate), items: [] };
        groups.push(cur);
      }
      cur.items.push(t);
    }
    return groups;
  }, [tasks]);

  const selectedTasks = tasksByDay[dayKey(selected)] || [];

  const handleAdd = async (e) => {
    e.preventDefault();
    const title = draft.title.trim();
    if (!title) return;
    setSaving(true);
    try {
      const due = new Date(selected);
      due.setHours(12, 0, 0, 0);
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

  const goAgenda = () => {
    setSelected(new Date());
    setView('agenda');
  };

  const Toggle = (
    <div className="inline-flex rounded-full bg-gray-100 p-1 dark:bg-white/5">
      {[
        { k: 'month', icon: LayoutGrid, label: 'Month' },
        { k: 'agenda', icon: List, label: 'Agenda' },
      ].map(({ k, icon: Icon, label }) => (
        <button
          key={k}
          onClick={k === 'agenda' ? goAgenda : () => setView('month')}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition ${
            view === k ? 'bg-white text-brand-600 shadow-sm dark:bg-[#2A2733] dark:text-white' : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <Icon size={14} /> {label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl">
      {/* Top bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
          {format(currentDate, 'MMMM')} <span className="font-medium text-gray-400">{format(currentDate, 'yyyy')}</span>
        </h2>
        {Toggle}
      </div>

      {view === 'month' ? (
        <>
          {/* Month nav */}
          <div className="mb-3 flex items-center justify-end gap-1.5">
            <button
              onClick={() => setCurrentDate(new Date())}
              className="rounded-full px-3 py-1 text-sm font-medium text-gray-500 transition hover:text-brand-600 dark:text-gray-400"
            >
              Today
            </button>
            <button onClick={() => setCurrentDate((d) => subMonths(d, 1))} className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-brand-600 dark:hover:bg-white/5" aria-label="Previous month">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => setCurrentDate((d) => addMonths(d, 1))} className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-brand-600 dark:hover:bg-white/5" aria-label="Next month">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7">
            {WEEKDAYS.map((d, i) => (
              <div key={i} className="pb-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-300 dark:text-gray-600">
                {d}
              </div>
            ))}
          </div>

          {/* Borderless dot grid */}
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const inMonth = isSameMonth(day, currentDate);
              const today = isToday(day);
              const isSelected = isSameDay(day, selected);
              const dayTasks = tasksByDay[dayKey(day)] || [];
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelected(day)}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl transition hover:bg-gray-100 dark:hover:bg-white/5"
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm transition
                      ${today ? 'bg-brand-gradient font-semibold text-white shadow-brand-sm' : ''}
                      ${!today && isSelected ? 'bg-brand-100 font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-200' : ''}
                      ${!today && !isSelected && inMonth ? 'text-gray-700 dark:text-gray-200' : ''}
                      ${!inMonth ? 'text-gray-300 dark:text-gray-600' : ''}`}
                  >
                    {format(day, 'd')}
                  </span>
                  <div className="flex h-1.5 items-center gap-0.5">
                    {dayTasks.slice(0, 3).map((t) => (
                      <span key={t._id} className={`h-1.5 w-1.5 rounded-full ${dotColor(t.priority)}`} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected day — flows below the grid (single column) */}
          <div className="mt-6 border-t border-gray-100 pt-5 dark:border-[#2A2733]">
            <h3 className="mb-3 font-display text-lg font-bold text-gray-900 dark:text-white">
              {isToday(selected) ? 'Today · ' : ''}
              {format(selected, 'EEEE, MMMM d')}
            </h3>
            <AddForm draft={draft} setDraft={setDraft} onSubmit={handleAdd} saving={saving} />
            {loading ? (
              <div className="flex justify-center py-8 text-gray-400"><Loader2 className="animate-spin" /></div>
            ) : selectedTasks.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">No events. Add one above.</p>
            ) : (
              <ul className="mt-3 divide-y divide-gray-100 dark:divide-[#2A2733]">
                <AnimatePresence initial={false}>
                  {selectedTasks.map((t) => <EventRow key={t._id} t={t} onDelete={handleDelete} />)}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </>
      ) : (
        /* Agenda */
        <div>
          <div className="mb-5">
            <AddForm draft={draft} setDraft={setDraft} onSubmit={handleAdd} saving={saving} />
            <p className="mt-1.5 text-xs text-gray-400">Adds to today — switch to Month to pick another date.</p>
          </div>
          {loading ? (
            <div className="flex justify-center py-12 text-gray-400"><Loader2 className="animate-spin" /></div>
          ) : agendaGroups.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-medium text-gray-700 dark:text-gray-200">Nothing upcoming</p>
              <p className="mt-1 text-sm text-gray-400">Add an event above to get started.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {agendaGroups.map((g) => (
                <div key={g.key}>
                  <div className="mb-1 flex items-baseline gap-2 border-b border-gray-100 pb-1 dark:border-[#2A2733]">
                    <span className="font-display text-sm font-bold text-gray-900 dark:text-white">{groupLabel(g.date)}</span>
                  </div>
                  <ul className="divide-y divide-gray-100 dark:divide-[#2A2733]">
                    <AnimatePresence initial={false}>
                      {g.items.map((t) => <EventRow key={t._id} t={t} onDelete={handleDelete} />)}
                    </AnimatePresence>
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarView;
