import { useState, useCallback, useEffect, useRef } from 'react';
import { getAllTasks, createTask, updateTask, deleteTask } from '../services/taskService';
import { useWorkspace } from '../context/WorkspaceContext';
import { logger } from '../utils/logger';

// Shared task-list state + CRUD — previously Dashboard.jsx and
// CalendarView.jsx each independently fetched/created/updated/deleted tasks
// against the same API, maintaining two separate in-memory copies with
// duplicated logic. Page-specific orchestration (undo toasts, bulk actions,
// natural-language quick-add parsing, drag-and-drop) stays in each
// component, built on top of these shared primitives.
export function useTasks() {
  const { workspace, workspaceReady } = useWorkspace();
  const workspaceId = workspace?.id;
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Only the newest load may write `tasks` — a slow response for a workspace
  // the user already switched away from must not overwrite the current board.
  const latestLoad = useRef(0);

  const load = useCallback(async () => {
    // Wait for the active workspace: loading before it's known would fetch
    // every task the user can see across all workspaces, then reload.
    if (!workspaceReady) return [];
    const requestId = ++latestLoad.current;
    setLoading(true);
    try {
      // Full list, not a single capped page — Dashboard's category grouping
      // and the `?edit=` deep-link lookup both need the complete set (see
      // taskService.js#getAllTasks for why a single request isn't enough).
      // Scoped to the active workspace; with none (lookup failed) it falls
      // back to the caller's own tasks, the old behavior.
      const items = await getAllTasks(workspaceId ? { workspaceId } : {});
      if (requestId === latestLoad.current) setTasks(items);
      return items;
    } catch (e) {
      logger.warn('Failed to load tasks', { error: e.message });
      return [];
    } finally {
      if (requestId === latestLoad.current) setLoading(false);
    }
  }, [workspaceId, workspaceReady]);

  useEffect(() => {
    load();
  }, [load]);

  // New tasks are created in the workspace the user is currently working in.
  const create = useCallback(
    async (payload) => {
      const { data } = await createTask(workspaceId ? { workspaceId, ...payload } : payload);
      setTasks((prev) => [...prev, data.task]);
      return data.task;
    },
    [workspaceId]
  );

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
