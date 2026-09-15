import { useState, useCallback, useEffect } from 'react';
import { getAllTasks, createTask, updateTask, deleteTask } from '../services/taskService';
import { logger } from '../utils/logger';

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
      // Full list, not a single capped page — Dashboard's category grouping
      // and the `?edit=` deep-link lookup both need the complete set (see
      // taskService.js#getAllTasks for why a single request isn't enough).
      const items = await getAllTasks();
      setTasks(items);
      return items;
    } catch (e) {
      logger.warn('Failed to load tasks', { error: e.message });
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
      // Not logged here — rethrown to the caller, which is always the one
      // that actually knows what this patch was for (toggle/bulk/drag) and
      // already logs it with that context (see Dashboard.jsx). Logging here
      // too would just duplicate the same failure under a generic message.
      if (previous) setTasks((prev) => prev.map((t) => (t.id === id ? previous : t)));
      throw e;
    }
  }, []);

  // Callers own the optimistic removal + any undo-timer UI; this just does
  // the actual API call.
  const remove = useCallback((id) => deleteTask(id), []);

  return { tasks, setTasks, loading, load, create, patch, remove };
}
