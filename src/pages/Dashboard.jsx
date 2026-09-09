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
import { TASK_CATEGORIES as CATEGORIES } from '../utils/constants';
import { parseQuickAdd } from '../utils/quickAddParser';

const PRIORITIES = ['High', 'Medium', 'Low'];

// Map a persisted task to the shape the card/analytics components expect.
const toView = (t) => ({ ...t, completed: t.status === 'done', tags: t.tags || [] });

const Dashboard = () => {
  const { tasks, setTasks, loading, create, patch, remove } = useTasks();
  const [filterText, setFilterText] = useState('');
  const [drafts, setDrafts] = useState(
    CATEGORIES.reduce((acc, c) => ({ ...acc, [c]: { title: '', description: '', priority: 'Medium', open: false } }), {})
  );
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const { notify } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showWelcome, setShowWelcome] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

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

  const addTask = async (category, data) => {
    const payload = data
      ? { title: data.title, description: data.description, priority: data.priority, category: data.category || category, dueDate: data.dueDate, tags: data.tags, recurrence: data.recurrence }
      : drafts[category];
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
        category: payload.category || category,
        dueDate: dueDate || null,
        tags: payload.tags || [],
        recurrence: payload.recurrence || null,
      });
      if (!data) setDrafts((d) => ({ ...d, [category]: { title: '', description: '', priority: 'Medium', open: false } }));
      setShowTaskForm(false);
      notify('success', 'Task created', created.title);
    } catch (e) {
      notify('error', 'Could not create task');
      console.error(e);
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
      console.error(e);
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
      if (!undone) remove(task.id).catch((e) => console.error(e));
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
    await patch(task.id, { status }).catch((e) => console.error(e));
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
    await Promise.all(ids.map((id) => patch(id, { status: 'done' }).catch((e) => console.error(e))));
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
      if (!undone) ids.forEach((id) => remove(id).catch((e) => console.error(e)));
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
    const category = destination.droppableId;
    // `patch` rolls back on failure — previously a failed category change
    // here left the board silently out of sync with the server.
    patch(draggableId, { category }).catch((e) => console.error(e));
  };

  const grouped = useMemo(() => {
    const q = filterText.toLowerCase();
    return CATEGORIES.reduce((acc, c) => {
      acc[c] = tasks
        .filter((t) => (t.category || 'Personal') === c)
        .filter((t) => t.title.toLowerCase().includes(q))
        .map(toView);
      return acc;
    }, {});
  }, [tasks, filterText]);

  const analyticsTasks = useMemo(() => tasks.map(toView), [tasks]);

  return (
    <>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-6 lg:flex-row">
          <div className="flex-1">
            <h2 className="mb-4 flex items-center gap-3 font-display text-3xl font-extrabold text-light-text dark:text-dark-text">
              <PlusCircle className="text-brand-500" /> Dashboard
            </h2>
            <QuickActions
              onAddTask={() => { setEditingTask(null); setShowTaskForm(true); }}
              onFilter={() => notify('info', 'Use the search box to filter')}
              onSearch={() => document.querySelector('input[type="text"]')?.focus()}
              onCalendar={() => navigate('/calendar')}
              onStats={() => navigate('/stats')}
            />
          </div>
          <div className="lg:w-80 space-y-6">
            <DailyDigest onFocusTask={(t) => { setEditingTask(toView(t)); setShowTaskForm(true); }} />
            <ActivityFeed limit={3} />
          </div>
        </div>

        <TaskAnalytics tasks={analyticsTasks} />

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
              {CATEGORIES.map((category) => (
                <Droppable key={category} droppableId={category}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex min-h-[400px] flex-col rounded-2xl border border-light-border bg-light-surface p-4 shadow-sm dark:border-dark-border dark:bg-dark-surface"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-display text-lg font-semibold text-light-text dark:text-dark-text">{category}</h3>
                        <button
                          onClick={() => setDrafts((d) => ({ ...d, [category]: { ...d[category], open: !d[category].open } }))}
                          className="rounded-full bg-brand-50 p-1.5 text-brand-600 transition hover:bg-brand-gradient hover:text-white dark:bg-brand-500/10 dark:text-brand-300"
                          aria-label={`Add task to ${category}`}
                        >
                          <PlusCircle className="text-lg" />
                        </button>
                      </div>

                      {drafts[category].open && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-4 space-y-2">
                          <input
                            type="text"
                            placeholder='Title — try "tomorrow" or "high priority"'
                            value={drafts[category].title}
                            onChange={(e) => setDrafts((d) => ({ ...d, [category]: { ...d[category], title: e.target.value } }))}
                            className="w-full rounded-lg border border-light-border bg-light-surface p-2 text-sm dark:border-dark-border dark:bg-dark-raised dark:text-dark-text"
                          />
                          <input
                            type="text"
                            placeholder="Description"
                            value={drafts[category].description}
                            onChange={(e) => setDrafts((d) => ({ ...d, [category]: { ...d[category], description: e.target.value } }))}
                            className="w-full rounded-lg border border-light-border bg-light-surface p-2 text-sm dark:border-dark-border dark:bg-dark-raised dark:text-dark-text"
                          />
                          <select
                            value={drafts[category].priority}
                            onChange={(e) => setDrafts((d) => ({ ...d, [category]: { ...d[category], priority: e.target.value } }))}
                            className="w-full rounded-lg border border-light-border bg-light-surface p-2 text-sm dark:border-dark-border dark:bg-dark-raised dark:text-dark-text"
                          >
                            {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                          </select>
                          <button
                            onClick={() => addTask(category)}
                            className="w-full rounded-lg bg-brand-gradient py-2 font-semibold text-white shadow-brand-sm transition hover:shadow-brand"
                          >
                            Add Task
                          </button>
                        </motion.div>
                      )}

                      <div className="flex-1 space-y-4">
                        {grouped[category].map((task, index) => (
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
          onSubmit={editingTask ? editTask : (data) => addTask(data.category, data)}
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
            className="rounded-full bg-brand-gradient px-4 py-1.5 text-sm font-medium text-white shadow-sm"
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
