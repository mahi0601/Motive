import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import { FiPlusCircle, FiSearch } from 'react-icons/fi';
import { Loader2 } from 'lucide-react';
import DashboardLayout from '../layout/DashboardLayout';
import EnhancedTaskCard from '../components/EnhancedTaskCard';
import TaskForm from '../components/TaskForm';
import QuickActions from '../components/QuickActions';
import TaskAnalytics from '../components/TaskAnalytics';
import ActivityFeed from '../components/ActivityFeed';
import KeyboardShortcuts from '../components/KeyboardShortcuts';
import NotificationToast from '../components/NotificationToast';
import { getTasks, createTask, updateTask, deleteTask } from '../services/taskService';

const CATEGORIES = ['Personal', 'Finance', 'Health', 'Development'];
const PRIORITIES = ['High', 'Medium', 'Low'];

// Map a persisted task to the shape the card/analytics components expect.
const toView = (t) => ({ ...t, id: t._id, completed: t.status === 'done', tags: t.tags || [] });

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [drafts, setDrafts] = useState(
    CATEGORIES.reduce((acc, c) => ({ ...acc, [c]: { title: '', description: '', priority: 'Medium', open: false } }), {})
  );
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getTasks({ limit: 200 });
        setTasks(data.items || []);
      } catch (e) {
        console.error('Failed to load tasks', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const notify = (type, title, message = '') => {
    const id = Date.now();
    setNotifications((n) => [...n, { id, type, title, message }]);
    setTimeout(() => setNotifications((n) => n.filter((x) => x.id !== id)), 4000);
  };
  const removeNotification = (id) => setNotifications((n) => n.filter((x) => x.id !== id));

  const addTask = async (category, data) => {
    const payload = data
      ? { title: data.title, description: data.description, priority: data.priority, category: data.category || category }
      : drafts[category];
    if (!payload.title?.trim()) return;
    try {
      const { data: res } = await createTask({
        title: payload.title,
        description: payload.description || '',
        priority: payload.priority || 'Medium',
        category: payload.category || category,
      });
      setTasks((prev) => [...prev, res.task]);
      if (!data) setDrafts((d) => ({ ...d, [category]: { title: '', description: '', priority: 'Medium', open: false } }));
      setShowTaskForm(false);
      notify('success', 'Task created', res.task.title);
    } catch (e) {
      notify('error', 'Could not create task');
      console.error(e);
    }
  };

  const editTask = async (data) => {
    try {
      const { data: res } = await updateTask(editingTask.id, {
        title: data.title,
        description: data.description,
        priority: data.priority,
        category: data.category,
      });
      setTasks((prev) => prev.map((t) => (t._id === editingTask.id ? res.task : t)));
      notify('success', 'Task updated', res.task.title);
    } catch (e) {
      notify('error', 'Could not update task');
      console.error(e);
    } finally {
      setEditingTask(null);
      setShowTaskForm(false);
    }
  };

  const removeTask = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    setTasks((prev) => prev.filter((t) => t._id !== task.id));
    await deleteTask(task.id).catch((e) => console.error(e));
    notify('success', 'Task deleted', task.title);
  };

  const toggleComplete = async (task) => {
    const status = task.completed ? 'todo' : 'done';
    setTasks((prev) => prev.map((t) => (t._id === task.id ? { ...t, status } : t)));
    await updateTask(task.id, { status }).catch((e) => console.error(e));
  };

  const onDragEnd = ({ destination, source, draggableId }) => {
    if (!destination || destination.droppableId === source.droppableId) return;
    const category = destination.droppableId;
    setTasks((prev) => prev.map((t) => (t._id === draggableId ? { ...t, category } : t)));
    updateTask(draggableId, { category }).catch((e) => console.error(e));
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
    <DashboardLayout>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-6 lg:flex-row">
          <div className="flex-1">
            <h2 className="mb-4 flex items-center gap-3 font-display text-3xl font-extrabold text-gray-900 dark:text-white">
              <FiPlusCircle className="text-brand-500" /> Dashboard
            </h2>
            <QuickActions
              onAddTask={() => { setEditingTask(null); setShowTaskForm(true); }}
              onFilter={() => notify('info', 'Use the search box to filter')}
              onSearch={() => document.querySelector('input[type="text"]')?.focus()}
              onCalendar={() => (window.location.href = '/calendar')}
              onStats={() => (window.location.href = '/stats')}
            />
          </div>
          <div className="lg:w-80">
            <ActivityFeed limit={3} />
          </div>
        </div>

        <TaskAnalytics tasks={analyticsTasks} />

        <div className="mx-auto mb-6 max-w-md">
          <div className="relative">
            <FiSearch className="absolute left-3 top-3.5 text-gray-400" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter tasks by title…"
              className="w-full rounded-lg border border-gray-300 bg-white p-3 pl-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20 text-gray-400"><Loader2 className="animate-spin" size={28} /></div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {CATEGORIES.map((category) => (
                <Droppable key={category} droppableId={category}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex min-h-[400px] flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-[#2A2733] dark:bg-[#17151D]"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-display text-lg font-semibold text-gray-800 dark:text-white">{category}</h3>
                        <button
                          onClick={() => setDrafts((d) => ({ ...d, [category]: { ...d[category], open: !d[category].open } }))}
                          className="rounded-full bg-brand-50 p-1.5 text-brand-600 transition hover:bg-brand-gradient hover:text-white dark:bg-brand-500/10 dark:text-brand-300"
                          aria-label={`Add task to ${category}`}
                        >
                          <FiPlusCircle className="text-lg" />
                        </button>
                      </div>

                      {drafts[category].open && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-4 space-y-2">
                          <input
                            type="text"
                            placeholder="Title"
                            value={drafts[category].title}
                            onChange={(e) => setDrafts((d) => ({ ...d, [category]: { ...d[category], title: e.target.value } }))}
                            className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          />
                          <input
                            type="text"
                            placeholder="Description"
                            value={drafts[category].description}
                            onChange={(e) => setDrafts((d) => ({ ...d, [category]: { ...d[category], description: e.target.value } }))}
                            className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          />
                          <select
                            value={drafts[category].priority}
                            onChange={(e) => setDrafts((d) => ({ ...d, [category]: { ...d[category], priority: e.target.value } }))}
                            className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(prov) => (
                              <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                                <EnhancedTaskCard
                                  task={task}
                                  onEdit={(t) => { setEditingTask(t); setShowTaskForm(true); }}
                                  onDelete={removeTask}
                                  onComplete={toggleComplete}
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

      <NotificationToast notifications={notifications} onRemove={removeNotification} />
      <KeyboardShortcuts />
    </DashboardLayout>
  );
};

export default Dashboard;
