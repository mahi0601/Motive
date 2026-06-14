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
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  CalendarDays,
  Loader2,
  LayoutGrid,
  List,
} from 'lucide-react';
import { getTasks, createTask, deleteTask } from '../services/taskService';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const PRIORITY = {
  High: { dot: 'bg-rose-500', chip: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' },
  Medium: { dot: 'bg-spark-500', chip: 'bg-spark-100 text-spark-700 dark:bg-spark-500/15 dark:text-spark-300' },
  Low: { dot: 'bg-brand-500', chip: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300' },
};

const dayKey = (d) => format(d, 'yyyy-MM-dd');
const groupLabel = (d) =>
  isToday(d) ? 'Today' : isTomorrow(d) ? 'Tomorrow' : format(d, 'EEEE, MMM d');

// ── Module-level subcomponents (stable identity → inputs keep focus) ──
const ViewToggle = ({ view, onMonth, onAgenda }) => (
  <div className="inline-flex rounded-lg border border-gray-200 p-0.5 dark:border-[#2A2733]">
    <button
      onClick={onMonth}
      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium transition ${
        view === 'month' ? 'bg-brand-gradient text-white' : 'text-gray-500 dark:text-gray-300'
      }`}
    >
      <LayoutGrid size={14} /> Month
    </button>
    <button
      onClick={onAgenda}
      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium transition ${
        view === 'agenda' ? 'bg-brand-gradient text-white' : 'text-gray-500 dark:text-gray-300'
      }`}
    >
      <List size={14} /> Agenda
    </button>
  </div>
);

const AddForm = ({ draft, setDraft, onSubmit, saving, label }) => (
  <form onSubmit={onSubmit} className="space-y-2">
    {label && <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>}
    <input
      value={draft.title}
      onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
      placeholder="Add an event…"
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-[#2A2733] dark:bg-[#0e0d12] dark:text-white"
    />
    <div className="flex flex-wrap items-center gap-2">
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
);

const EventRow = ({ t, onDelete }) => (
  <motion.li
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, height: 0 }}
    className="group flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-[#2A2733] dark:bg-[#0e0d12]"
  >
    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${(PRIORITY[t.priority] || PRIORITY.Low).dot}`} />
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
  const [view, setView] = useState('month'); // 'month' | 'agenda'
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

  // Upcoming events grouped by day (today onward) for the agenda view.
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

  const goAgenda = () => {
    setSelected(new Date()); // new events default to today in agenda
    setView('agenda');
  };

  return (
    <div>
      {/* Top bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
          {format(currentDate, 'MMMM')} <span className="text-gray-400">{format(currentDate, 'yyyy')}</span>
        </h2>
        <div className="flex items-center gap-2">
          <ViewToggle view={view} onMonth={() => setView('month')} onAgenda={goAgenda} />
          {view === 'month' && (
            <div className="flex items-center gap-1.5">
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
          )}
        </div>
      </div>

      {view === 'month' ? (
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Calendar grid */}
          <div className="flex-1">
            <div className="mb-2 grid grid-cols-7 gap-1 sm:gap-1.5">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-400 sm:text-xs">
                  <span className="sm:hidden">{d.charAt(0)}</span>
                  <span className="hidden sm:inline">{d}</span>
                </div>
              ))}
            </div>

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
                    className={`group relative flex min-h-[56px] min-w-0 flex-col items-center rounded-lg border p-1 transition sm:min-h-[80px] sm:items-stretch sm:rounded-xl sm:p-1.5
                      ${isSelected ? 'border-brand-500 ring-2 ring-brand-500/30' : 'border-gray-200 dark:border-[#2A2733]'}
                      ${inMonth ? 'bg-white dark:bg-[#17151D]' : 'bg-gray-50/60 dark:bg-[#121016]'}
                      hover:border-brand-400`}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold sm:mb-1 sm:text-xs
                        ${today ? 'bg-brand-gradient text-white' : inMonth ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-600'}`}
                    >
                      {format(day, 'd')}
                    </span>

                    {/* Chips on sm+ */}
                    <div className="hidden min-w-0 flex-col gap-1 overflow-hidden sm:flex">
                      {dayTasks.slice(0, 2).map((t) => (
                        <span
                          key={t._id}
                          className={`truncate rounded px-1.5 py-0.5 text-[10px] font-medium ${(PRIORITY[t.priority] || PRIORITY.Low).chip}`}
                        >
                          {t.title}
                        </span>
                      ))}
                      {dayTasks.length > 2 && (
                        <span className="px-1 text-[10px] font-medium text-gray-400">+{dayTasks.length - 2} more</span>
                      )}
                    </div>

                    {/* Dots on mobile */}
                    {dayTasks.length > 0 && (
                      <div className="mt-1 flex flex-wrap justify-center gap-0.5 sm:hidden">
                        {dayTasks.slice(0, 3).map((t) => (
                          <span key={t._id} className={`h-1.5 w-1.5 rounded-full ${(PRIORITY[t.priority] || PRIORITY.Low).dot}`} />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day panel */}
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

              <div className="mb-4">
                <AddForm draft={draft} setDraft={setDraft} onSubmit={handleAdd} saving={saving} />
              </div>

              {loading ? (
                <div className="flex justify-center py-8 text-gray-400"><Loader2 className="animate-spin" /></div>
              ) : selectedTasks.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">No events on this day.</p>
              ) : (
                <ul className="space-y-2">
                  <AnimatePresence initial={false}>
                    {selectedTasks.map((t) => <EventRow key={t._id} t={t} onDelete={handleDelete} />)}
                  </AnimatePresence>
                </ul>
              )}
            </div>
          </aside>
        </div>
      ) : (
        /* ── Agenda view ── */
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-[#2A2733] dark:bg-[#17151D]">
            <AddForm draft={draft} setDraft={setDraft} onSubmit={handleAdd} saving={saving} label="New event for today" />
          </div>

          {loading ? (
            <div className="flex justify-center py-12 text-gray-400"><Loader2 className="animate-spin" /></div>
          ) : agendaGroups.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 py-16 text-center dark:border-[#2A2733]">
              <CalendarDays className="mx-auto mb-3 text-gray-300 dark:text-gray-600" size={36} />
              <p className="font-medium text-gray-700 dark:text-gray-200">Nothing upcoming</p>
              <p className="mt-1 text-sm text-gray-400">Add an event above to get started.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {agendaGroups.map((g) => (
                <div key={g.key}>
                  <div className="mb-2 flex items-baseline gap-2">
                    <span className="font-display text-sm font-bold text-gray-900 dark:text-white">
                      {groupLabel(g.date)}
                    </span>
                    {!isToday(g.date) && !isTomorrow(g.date) && (
                      <span className="text-xs text-gray-400">{format(g.date, 'yyyy')}</span>
                    )}
                  </div>
                  <ul className="space-y-2">
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
