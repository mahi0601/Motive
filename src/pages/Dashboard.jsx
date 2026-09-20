import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import { CheckSquare, Loader2, PlusCircle, Search, X } from 'lucide-react';
import EnhancedTaskCard from '../components/tasks/EnhancedTaskCard';
import TaskForm from '../components/tasks/TaskForm';
import QuickActions from '../components/tasks/QuickActions';
import TaskAnalytics from '../components/tasks/TaskAnalytics';
import ActivityFeed from '../components/collab/ActivityFeed';
import DailyDigest from '../components/tasks/DailyDigest';
import KeyboardShortcuts from '../components/app/KeyboardShortcuts';
import WelcomeModal, { hasSeenWelcome } from '../components/app/WelcomeModal';
import { useToast } from '../context/ToastContext';
import { useTasks } from '../hooks/useTasks';
import { logger } from '../utils/logger';
import { parseQuickAdd } from '../utils/quickAddParser';
import { STATUS, getStatusLabel, getStatusDotClass } from '../utils/statusColors';

const PRIORITIES = ['High', 'Medium', 'Low'];
// Keep in sync with AT_RISK_WINDOW_MS in motive-backend/src/services/momentum.service.js
// — this is what makes the /momentum "At risk" tile's count and this board's
// ?highlight=at-risk filter agree on the same set of tasks.
const AT_RISK_WINDOW_MS = 48 * 60 * 60 * 1000;

// The board's columns, by delivery status rather than the old life-area
// categories (Personal/Finance/Health/Development) — those made sense for a
// solo consumer app but don't represent a workflow. `key` is the literal
// TaskStatus enum value (also the Droppable id, also what gets `patch`ed on
// drag), `status` is the richer statusColors.js STATUS this column
// represents, reusing the same vocabulary Momentum already uses ("Shipped",
// "In flight") instead of a third naming scheme. `category` still exists on
// every task — see EnhancedTaskCard's tag — it's just no longer the axis
// the board is organized by.
const BOARD_COLUMNS = [
  { key: 'todo', status: STATUS.NOT_STARTED },
  { key: 'in_progress', status: STATUS.IN_FLIGHT },
  { key: 'done', status: STATUS.SHIPPED },
];

// Map a persisted task to the shape the card/analytics components expect.
const toView = (t) => ({ ...t, completed: t.status === 'done', tags: t.tags || [] });

// The predicate side of a Momentum click-through (see Dashboard's
// `highlight`/`since` state and Momentum.jsx#highlightUrl for the other side
// of this contract). `null`/unrecognized highlights match everything, so a
// stale or malformed link degrades to "show all" rather than "show nothing."
// `since` (an ISO instant) narrows 'done' to completedAt >= since — the
// server's own timezone-aware period boundary, not recomputed here, so this
// can't reintroduce the timezone/week-start bug /momentum was built to fix.
function matchesHighlight(task, highlight, since) {
  if (!highlight) return true;
  if (highlight.startsWith('category:')) return (task.category || 'Personal') === highlight.slice('category:'.length);
  const now = new Date();
  switch (highlight) {
    case 'overdue':
      return task.dueDate && new Date(task.dueDate) < now && task.status !== 'done';
    case 'at-risk': {
      if (!task.dueDate || task.status === 'done') return false;
      const due = new Date(task.dueDate);
      return due >= now && due.getTime() - now.getTime() <= AT_RISK_WINDOW_MS;
    }
    case 'in-progress':
      return task.status === 'in_progress';
    case 'todo':
      return task.status === 'todo';
    case 'done':
      return task.status === 'done' && (!since || (task.completedAt && new Date(task.completedAt) >= new Date(since)));
    default:
      return true;
  }
}

const HIGHLIGHT_LABELS = {
  overdue: 'Overdue',
  'at-risk': 'At risk',
  'in-progress': 'In progress',
  todo: 'To do',
  done: 'Shipped',
};
const highlightLabel = (h) => (h?.startsWith('category:') ? h.slice('category:'.length) : HIGHLIGHT_LABELS[h] || h);

const Dashboard = () => {
  const { tasks, setTasks, loading, create, patch, remove } = useTasks();
  const [filterText, setFilterText] = useState('');
  const [drafts, setDrafts] = useState(
    BOARD_COLUMNS.reduce((acc, col) => ({ ...acc, [col.key]: { title: '', description: '', priority: 'Medium', open: false } }), {})
  );
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const { notify } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showWelcome, setShowWelcome] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  // A click-through target from /momentum: ?highlight=overdue|at-risk|
  // in-progress|done|category:<Name> — a tile's or insight's `filter` maps
  // to exactly one of these (see Momentum.jsx#toHighlight). Read once on
  // mount (like the `?new=task` and `?edit=` params above), kept in state
  // rather than re-read from the URL so it can be cleared without a
  // round-trip.
  const [highlight, setHighlight] = useState(() => searchParams.get('highlight'));
  const [highlightSince, setHighlightSince] = useState(() => searchParams.get('since'));
  useEffect(() => {
    if (!searchParams.get('highlight') && !searchParams.get('since')) return;
    setSearchParams((p) => {
      p.delete('highlight');
      p.delete('since');
      return p;
    }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const clearHighlight = () => { setHighlight(null); setHighlightSince(null); };

  // Only for a genuinely new, empty account — not just "never dismissed in
  // this browser" (that would also fire for an existing user on a fresh
  // device/incognito window). `loading` flips false exactly once, right
  // after the shared hook's initial fetch resolves.
  useEffect(() => {
    if (!loading && tasks.length === 0 && !hasSeenWelcome()) setShowWelcome(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // The command palette's "New task" action lands here as ?new=task.
  useEffect(() => {
    if (searchParams.get('new') === 'task') {
      setEditingTask(null);
      setShowTaskForm(true);
      setSearchParams((p) => {
        p.delete('new');
        return p;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // A task result picked in the command palette lands here as ?edit=<id> —
  // wait for tasks to actually be loaded before looking it up.
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId || loading) return;
    const task = tasks.find((t) => t.id === editId);
    if (task) {
      setEditingTask(toView(task));
      setShowTaskForm(true);
    }
    setSearchParams((p) => {
      p.delete('edit');
      return p;
    }, { replace: true });
  }, [searchParams, setSearchParams, tasks, loading]);

  // `columnKey` is only meaningful for quick-add (a specific column's inline
  // "+"), where it both looks up that column's draft and becomes the new
  // task's status. The full TaskForm modal (`data` present) isn't opened
  // from any particular column — it always defaults a new task into
  // "Not started" unless the form itself supplies a status — and still
  // carries its own free-text category, independent of the board's columns.
  const addTask = async (columnKey, data) => {
    const payload = data
      ? { title: data.title, description: data.description, priority: data.priority, category: data.category, status: data.status, dueDate: data.dueDate, tags: data.tags, recurrence: data.recurrence }
      : drafts[columnKey];
    if (!payload.title?.trim()) return;

    // Quick-add shorthand ("water plants tomorrow high priority") only —
    // the full task modal already has explicit priority/date controls, so
    // parsing there risks clobbering a deliberate choice that happens to
    // share a word with a date/priority phrase.
    let { title, priority, dueDate } = payload;
    if (!data) {
      const parsed = parseQuickAdd(payload.title);
      title = parsed.title;
      priority = parsed.priority || payload.priority;
      dueDate = parsed.dueDate || payload.dueDate;
    }

    try {
      const created = await create({
        title,
        description: payload.description || '',
        priority: priority || 'Medium',
        status: data ? (payload.status || 'todo') : columnKey,
        category: payload.category,
        dueDate: dueDate || null,
        tags: payload.tags || [],
        recurrence: payload.recurrence || null,
      });
      if (!data) setDrafts((d) => ({ ...d, [columnKey]: { title: '', description: '', priority: 'Medium', open: false } }));
      setShowTaskForm(false);
      notify('success', 'Task created', created.title);
    } catch (e) {
      notify('error', 'Could not create task');
      logger.warn('Task create failed', { error: e.message });
    }
  };

  const editTask = async (data) => {
    try {
      const updated = await patch(editingTask.id, {
        title: data.title,
        description: data.description,
        priority: data.priority,
        category: data.category,
        dueDate: data.dueDate || null,
        tags: data.tags || [],
        recurrence: data.recurrence || null,
      });
      notify('success', 'Task updated', updated.title);
    } catch (e) {
      notify('error', 'Could not update task');
      logger.warn('Task update failed', { taskId: editingTask?.id, error: e.message });
    } finally {
      setEditingTask(null);
      setShowTaskForm(false);
    }
  };

  // Optimistically hide the task, then actually delete it after a grace
  // window — long enough for the "Undo" toast action to cancel it.
  const removeTask = (task) => {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    let undone = false;
    const timer = setTimeout(() => {
      if (!undone) remove(task.id).catch((e) => logger.warn('Task delete failed', { taskId: task.id, error: e.message }));
    }, 5000);
    notify('info', 'Task deleted', task.title, {
      label: 'Undo',
      onAction: () => {
        undone = true;
        clearTimeout(timer);
        setTasks((prev) => [...prev, task]);
      },
    });
  };

  const toggleComplete = async (task) => {
    const status = task.completed ? 'todo' : 'done';
    await patch(task.id, { status }).catch((e) => logger.warn('Task complete-toggle failed', { taskId: task.id, error: e.message }));
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const bulkComplete = async () => {
    const ids = [...selectedIds];
    exitSelectMode();
    // Per-task optimistic update + rollback-on-failure (via the shared
    // hook), rather than one blanket optimistic pass with no rollback —
    // a task whose update actually fails no longer silently drifts out of
    // sync with the server.
    await Promise.all(ids.map((id) => patch(id, { status: 'done' }).catch((e) => logger.warn('Bulk complete failed for a task', { taskId: id, error: e.message }))));
    notify('success', `Completed ${ids.length} task${ids.length === 1 ? '' : 's'}`);
  };

  // Same undo pattern as single-task delete, just for the whole batch.
  const bulkDelete = () => {
    const ids = [...selectedIds];
    const removed = tasks.filter((t) => ids.includes(t.id));
    setTasks((prev) => prev.filter((t) => !ids.includes(t.id)));
    exitSelectMode();
    let undone = false;
    const timer = setTimeout(() => {
      if (!undone) ids.forEach((id) => remove(id).catch((e) => logger.warn('Bulk delete failed for a task', { taskId: id, error: e.message })));
    }, 5000);
    notify('info', `Deleted ${ids.length} task${ids.length === 1 ? '' : 's'}`, '', {
      label: 'Undo',
      onAction: () => {
        undone = true;
        clearTimeout(timer);
        setTasks((prev) => [...prev, ...removed]);
      },
    });
  };

  const onDragEnd = ({ destination, source, draggableId }) => {
    if (!destination || destination.droppableId === source.droppableId) return;
    const status = destination.droppableId;
    // `patch` rolls back on failure — previously a failed status change
    // here left the board silently out of sync with the server. The backend
    // derives `completedAt` itself on a transition into 'done' (same as
    // `toggleComplete` below), so nothing extra is needed here for that.
    patch(draggableId, { status }).catch((e) => logger.warn('Drag-drop status change failed', { taskId: draggableId, status, error: e.message }));
  };

  const grouped = useMemo(() => {
    const q = filterText.toLowerCase();
    return BOARD_COLUMNS.reduce((acc, col) => {
      acc[col.key] = tasks
        .filter((t) => (t.status || 'todo') === col.key)
        .filter((t) => t.title.toLowerCase().includes(q))
        .filter((t) => matchesHighlight(t, highlight, highlightSince))
        .map(toView);
      return acc;
    }, {});
  }, [tasks, filterText, highlight, highlightSince]);

  const analyticsTasks = useMemo(() => tasks.map(toView), [tasks]);

  return (
    <>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-6 lg:flex-row">
          <div className="flex-1">
            <h2 className="mb-4 flex items-center gap-3 font-display text-display font-semibold text-light-text dark:text-dark-text">
              <PlusCircle className="text-brand-500" /> My Work
            </h2>
            <QuickActions
              onAddTask={() => { setEditingTask(null); setShowTaskForm(true); }}
              onFilter={() => notify('info', 'Use the search box to filter')}
              onSearch={() => document.querySelector('input[type="text"]')?.focus()}
              onCalendar={() => navigate('/calendar')}
              onMomentum={() => navigate('/momentum')}
            />
          </div>
          <div className="lg:w-80 space-y-6">
            <DailyDigest onFocusTask={(t) => { setEditingTask(toView(t)); setShowTaskForm(true); }} />
            <ActivityFeed limit={3} />
          </div>
        </div>

        <TaskAnalytics tasks={analyticsTasks} />

        {highlight && (
          <div className="mx-auto mb-3 flex max-w-md items-center gap-2 text-sm">
            <span className="text-light-muted dark:text-dark-muted">Showing:</span>
            <span className="flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
              {highlightLabel(highlight)}
              <button onClick={clearHighlight} aria-label="Clear filter" className="hover:text-brand-900 dark:hover:text-brand-100">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          </div>
        )}
        <div className="mx-auto mb-6 flex max-w-md items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 text-light-muted dark:text-dark-muted" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter tasks by title…"
              className="w-full rounded-lg border border-light-border bg-light-surface p-3 pl-10 text-sm text-light-text focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-dark-border dark:bg-dark-raised dark:text-dark-text"
            />
          </div>
          <button
            onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-3 text-sm font-medium transition ${
              selectMode
                ? 'border-brand-500 bg-brand-soft text-brand-600'
                : 'border-light-border bg-light-surface text-light-muted hover:border-brand-500 dark:border-dark-border dark:bg-dark-raised dark:text-dark-muted'
            }`}
            title="Select multiple tasks"
          >
            {selectMode ? <X /> : <CheckSquare />}
            {selectMode ? 'Cancel' : 'Select'}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20 text-light-muted dark:text-dark-muted"><Loader2 className="animate-spin" size={28} /></div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {BOARD_COLUMNS.map((column) => (
                <Droppable key={column.key} droppableId={column.key}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex min-h-[400px] flex-col rounded-2xl border border-light-border bg-light-surface p-4 shadow-sm dark:border-dark-border dark:bg-dark-surface"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-light-text dark:text-dark-text">
                          <span className={`h-2 w-2 rounded-full ${getStatusDotClass(column.status)}`} />
                          {getStatusLabel(column.status)}
                        </h3>
                        <button
                          onClick={() => setDrafts((d) => ({ ...d, [column.key]: { ...d[column.key], open: !d[column.key].open } }))}
                          className="rounded-full bg-brand-50 p-1.5 text-brand-600 transition hover:bg-brand-600 hover:text-white dark:bg-brand-500/10 dark:text-brand-300"
                          aria-label={`Add task to ${getStatusLabel(column.status)}`}
                        >
                          <PlusCircle className="text-lg" />
                        </button>
                      </div>

                      {drafts[column.key].open && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-4 space-y-2">
                          <input
                            type="text"
                            placeholder='Title — try "tomorrow" or "high priority"'
                            value={drafts[column.key].title}
                            onChange={(e) => setDrafts((d) => ({ ...d, [column.key]: { ...d[column.key], title: e.target.value } }))}
                            className="w-full rounded-lg border border-light-border bg-light-surface p-2 text-sm dark:border-dark-border dark:bg-dark-raised dark:text-dark-text"
                          />
                          <input
                            type="text"
                            placeholder="Description"
                            value={drafts[column.key].description}
                            onChange={(e) => setDrafts((d) => ({ ...d, [column.key]: { ...d[column.key], description: e.target.value } }))}
                            className="w-full rounded-lg border border-light-border bg-light-surface p-2 text-sm dark:border-dark-border dark:bg-dark-raised dark:text-dark-text"
                          />
                          <select
                            value={drafts[column.key].priority}
                            onChange={(e) => setDrafts((d) => ({ ...d, [column.key]: { ...d[column.key], priority: e.target.value } }))}
                            className="w-full rounded-lg border border-light-border bg-light-surface p-2 text-sm dark:border-dark-border dark:bg-dark-raised dark:text-dark-text"
                          >
                            {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                          </select>
                          <button
                            onClick={() => addTask(column.key)}
                            className="w-full rounded-lg bg-brand-600 py-2 font-semibold text-white shadow-sm transition hover:bg-brand-700"
                          >
                            Add Task
                          </button>
                        </motion.div>
                      )}

                      <div className="flex-1 space-y-4">
                        {grouped[column.key].map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={selectMode}>
                            {(prov) => (
                              <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                                <EnhancedTaskCard
                                  task={task}
                                  onEdit={(t) => { setEditingTask(t); setShowTaskForm(true); }}
                                  onDelete={removeTask}
                                  onComplete={toggleComplete}
                                  selectMode={selectMode}
                                  selected={selectedIds.has(task.id)}
                                  onSelectToggle={() => toggleSelect(task.id)}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        )}
      </div>

      {showTaskForm && (
        <TaskForm
          onSubmit={editingTask ? editTask : (data) => addTask(null, data)}
          onClose={() => { setShowTaskForm(false); setEditingTask(null); }}
          initialData={editingTask}
        />
      )}

      <KeyboardShortcuts />
      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}

      {selectMode && selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-light-border bg-light-surface px-5 py-3 shadow-xl dark:border-dark-border dark:bg-dark-raised"
        >
          <span className="text-sm font-medium text-light-text dark:text-dark-text">
            {selectedIds.size} selected
          </span>
          <button
            onClick={bulkComplete}
            className="rounded-full bg-brand-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
          >
            Complete
          </button>
          <button
            onClick={bulkDelete}
            className="rounded-full border border-red-300 px-4 py-1.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
          >
            Delete
          </button>
        </motion.div>
      )}
    </>
  );
};

export default Dashboard;
