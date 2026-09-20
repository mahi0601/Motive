import React, { useMemo, useState } from 'react';
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
import { useTasks } from '../../hooks/useTasks';
import { logger } from '../../utils/logger';
import { getPriorityDotClass } from '../../utils/priorityColors';
import { getStatusDotClass, getTaskDisplayStatus } from '../../utils/statusColors';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Priority picker only — AddForm's three buttons for choosing a NEW event's
// priority, which has no dueDate/status yet to derive a delivery state from.
const dotColor = (p) => getPriorityDotClass(p);

// Existing-task display — the calendar's job is showing what needs
// attention, so a task already on the grid is colored by delivery status
// (shipped/in flight/at risk/overdue), not by priority. Priority and status
// are independent (see priorityColors.js's own note on this) — this is the
// same "hue means state" rule as the rest of the redesign, not a stand-in
// for priority.
const statusDotColor = (task) => getStatusDotClass(getTaskDisplayStatus(task));

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
      className="min-w-0 flex-1 rounded-full border border-light-border bg-light-border/30 px-4 py-2 text-sm outline-none transition focus:border-brand-500 focus:bg-light-surface focus:ring-2 focus:ring-brand-500/20 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text"
    />
    <div className="flex items-center gap-1">
      {['Low', 'Medium', 'High'].map((p) => (
        <button
          key={p}
          type="button"
          title={p}
          onClick={() => setDraft((d) => ({ ...d, priority: p }))}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
            draft.priority === p ? 'ring-2 ring-offset-1 ring-brand-400 dark:ring-offset-dark-surface' : 'opacity-60 hover:opacity-100'
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

// Draggable onto a month-grid day cell to reschedule (native HTML5 DnD --
// simpler than wiring ~42 day cells as react-beautiful-dnd Droppables for a
// single cross-container drag).
const EventRow = ({ t, onDelete, draggable }) => (
  <motion.li
    initial={{ opacity: 0, y: 4 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
    draggable={draggable}
    onDragStart={draggable ? (e) => e.dataTransfer.setData('text/plain', t.id) : undefined}
    className={`group flex items-center gap-3 py-2.5 ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
  >
    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusDotColor(t)}`} />
    <span className="flex-1 truncate text-sm text-light-text dark:text-dark-text">{t.title}</span>
    <button
      onClick={() => onDelete(t.id)}
      className="text-light-muted dark:text-dark-muted opacity-0 transition group-hover:opacity-100 hover:text-semantic-danger-500 dark:hover:text-semantic-danger-dark"
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
  const { tasks: allTasks, setTasks, loading, create, patch, remove } = useTasks();
  const [draft, setDraft] = useState({ title: '', priority: 'Medium' });
  const [saving, setSaving] = useState(false);
  const [dragOverDay, setDragOverDay] = useState(null);

  // Calendar only cares about tasks that actually have a due date — the
  // shared hook fetches the user's whole task list.
  const tasks = useMemo(() => allTasks.filter((t) => t.dueDate), [allTasks]);

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
      await create({ title, priority: draft.priority, dueDate: due.toISOString() });
      setDraft({ title: '', priority: 'Medium' });
    } catch (err) {
      logger.warn('Failed to add event', { error: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Keeps the existing time-of-day (noon), same as handleAdd, just moves the
  // date — the shared hook's `patch` handles the optimistic update + rollback.
  const rescheduleTask = async (id, day) => {
    const next = new Date(day);
    next.setHours(12, 0, 0, 0);
    const nextIso = next.toISOString();
    await patch(id, { dueDate: nextIso }).catch((e) => logger.warn('Task reschedule failed', { taskId: id, error: e.message }));
  };

  const handleDelete = async (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await remove(id).catch((e) => logger.warn('Calendar event delete failed', { taskId: id, error: e.message }));
  };

  const goAgenda = () => {
    setSelected(new Date());
    setView('agenda');
  };

  const Toggle = (
    <div className="inline-flex rounded-full bg-light-border/40 p-1 dark:bg-white/5">
      {[
        { k: 'month', icon: LayoutGrid, label: 'Month' },
        { k: 'agenda', icon: List, label: 'Agenda' },
      ].map(({ k, icon: Icon, label }) => (
        <button
          key={k}
          onClick={k === 'agenda' ? goAgenda : () => setView('month')}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition ${
            view === k ? 'bg-light-surface text-brand-600 shadow-sm dark:bg-dark-raised dark:text-dark-text' : 'text-light-muted dark:text-dark-muted'
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
        <h2 className="font-display text-2xl font-bold tracking-tight text-light-text dark:text-dark-text sm:text-3xl">
          {format(currentDate, 'MMMM')} <span className="font-medium text-light-muted dark:text-dark-muted">{format(currentDate, 'yyyy')}</span>
        </h2>
        {Toggle}
      </div>

      {view === 'month' ? (
        <>
          {/* Month nav */}
          <div className="mb-3 flex items-center justify-end gap-1.5">
            <button
              onClick={() => setCurrentDate(new Date())}
              className="rounded-full px-3 py-1 text-sm font-medium text-light-muted transition hover:text-brand-600 dark:text-dark-muted"
            >
              Today
            </button>
            <button onClick={() => setCurrentDate((d) => subMonths(d, 1))} className="rounded-full p-1.5 text-light-muted dark:text-dark-muted transition hover:bg-light-border/40 hover:text-brand-600 dark:hover:bg-white/5" aria-label="Previous month">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => setCurrentDate((d) => addMonths(d, 1))} className="rounded-full p-1.5 text-light-muted dark:text-dark-muted transition hover:bg-light-border/40 hover:text-brand-600 dark:hover:bg-white/5" aria-label="Next month">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7">
            {WEEKDAYS.map((d, i) => (
              <div key={i} className="pb-2 text-center text-xs font-semibold uppercase tracking-wider text-light-muted dark:text-dark-muted">
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
              const isDragOver = dragOverDay && isSameDay(dragOverDay, day);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelected(day)}
                  onDragOver={(e) => {
                    e.preventDefault(); // required for onDrop to fire at all
                    setDragOverDay(day);
                  }}
                  onDragLeave={() => setDragOverDay((d) => (isSameDay(d, day) ? null : d))}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverDay(null);
                    const id = e.dataTransfer.getData('text/plain');
                    if (id) rescheduleTask(id, day);
                  }}
                  className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl transition hover:bg-light-border/40 dark:hover:bg-white/5 ${
                    isDragOver ? 'bg-brand-soft ring-2 ring-brand-400' : ''
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm transition
                      ${today ? 'bg-brand-600 font-semibold text-white' : ''}
                      ${!today && isSelected ? 'bg-brand-100 font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-200' : ''}
                      ${!today && !isSelected && inMonth ? 'text-light-text dark:text-dark-text' : ''}
                      ${!inMonth ? 'text-light-muted dark:text-dark-muted' : ''}`}
                  >
                    {format(day, 'd')}
                  </span>
                  <div className="flex h-1.5 items-center gap-0.5">
                    {dayTasks.slice(0, 3).map((t) => (
                      <span key={t.id} className={`h-1.5 w-1.5 rounded-full ${statusDotColor(t)}`} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected day — flows below the grid (single column) */}
          <div className="mt-6 border-t border-light-border pt-5 dark:border-dark-border">
            <h3 className="mb-3 font-display text-lg font-bold text-light-text dark:text-dark-text">
              {isToday(selected) ? 'Today · ' : ''}
              {format(selected, 'EEEE, MMMM d')}
            </h3>
            <AddForm draft={draft} setDraft={setDraft} onSubmit={handleAdd} saving={saving} />
            {loading ? (
              <div className="flex justify-center py-8 text-light-muted dark:text-dark-muted"><Loader2 className="animate-spin" /></div>
            ) : selectedTasks.length === 0 ? (
              <p className="py-6 text-center text-sm text-light-muted dark:text-dark-muted">No events. Add one above.</p>
            ) : (
              <>
                <p className="mt-1 text-xs text-light-muted dark:text-dark-muted">Drag an event onto another day to reschedule it.</p>
                <ul className="mt-2 divide-y divide-light-border dark:divide-dark-border">
                  <AnimatePresence initial={false}>
                    {selectedTasks.map((t) => <EventRow key={t.id} t={t} onDelete={handleDelete} draggable />)}
                  </AnimatePresence>
                </ul>
              </>
            )}
          </div>
        </>
      ) : (
        /* Agenda */
        <div>
          <div className="mb-5">
            <AddForm draft={draft} setDraft={setDraft} onSubmit={handleAdd} saving={saving} />
            <p className="mt-1.5 text-xs text-light-muted dark:text-dark-muted">Adds to today — switch to Month to pick another date.</p>
          </div>
          {loading ? (
            <div className="flex justify-center py-12 text-light-muted dark:text-dark-muted"><Loader2 className="animate-spin" /></div>
          ) : agendaGroups.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-medium text-light-text dark:text-dark-text">Nothing upcoming</p>
              <p className="mt-1 text-sm text-light-muted dark:text-dark-muted">Add an event above to get started.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {agendaGroups.map((g) => (
                <div key={g.key}>
                  <div className="mb-1 flex items-baseline gap-2 border-b border-light-border pb-1 dark:border-dark-border">
                    <span className="font-display text-sm font-bold text-light-text dark:text-dark-text">{groupLabel(g.date)}</span>
                  </div>
                  <ul className="divide-y divide-light-border dark:divide-dark-border">
                    <AnimatePresence initial={false}>
                      {g.items.map((t) => <EventRow key={t.id} t={t} onDelete={handleDelete} />)}
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
