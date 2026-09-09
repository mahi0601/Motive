import { useState, useCallback, useEffect } from 'react';
import { getTasks, createTask, updateTask, deleteTask } from '../services/taskService';

// Shared task-list state + CRUD — previously Dashboard.jsx and
// CalendarView.jsx each independently fetched/created/updated/deleted tasks
// against the same API, maintaining two separate in-memory copies with
// duplicated logic. Page-specific orchestration (undo toasts, bulk actions,
// natural-language quick-add parsing, drag-and-drop) stays in each
// component, built on top of these shared primitives.
export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getTasks({ limit: 200 });
      const items = data.items || [];
      setTasks(items);
      return items;
    } catch (e) {
      console.error('Failed to load tasks', e);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = useCallback(async (payload) => {
    const { data } = await createTask(payload);
    setTasks((prev) => [...prev, data.task]);
    return data.task;
  }, []);

  // Optimistic update with rollback on failure. `localPatch` is applied to
  // in-memory state immediately; `serverPatch` (defaults to the same value)
  // is what's actually sent to the API — callers that need the two to
  // differ (rare) can pass both.
  const patch = useCallback(async (id, localPatch, serverPatch = localPatch) => {
    let previous;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        previous = t;
        return { ...t, ...localPatch };
      })
    );
    try {
      const { data } = await updateTask(id, serverPatch);
      setTasks((prev) => prev.map((t) => (t.id === id ? data.task : t)));
      return data.task;
    } catch (e) {
      console.error('Failed to update task', e);
      if (previous) setTasks((prev) => prev.map((t) => (t.id === id ? previous : t)));
      throw e;
    }
  }, []);

  // Callers own the optimistic removal + any undo-timer UI; this just does
  // the actual API call.
  const remove = useCallback((id) => deleteTask(id), []);

  return { tasks, setTasks, loading, load, create, patch, remove };
}
