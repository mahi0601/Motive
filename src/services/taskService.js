import api from './api';

// Uses the shared axios instance (baseURL + auth token + silent refresh).
export const getTasks = (params = {}) => api.get('/api/tasks', { params });

// The server caps a single page at 100 (motive-backend/src/utils/pagination.js),
// but callers that need the COMPLETE list for a correct client-side
// aggregate (Dashboard's category grouping, Statistics' streaks/averages)
// can't just ask for a bigger single page — they need every task. Pages
// through using the `hasMore` flag the server already returns, so this is
// correct regardless of how many tasks the account actually has.
//
// Capped at MAX_PAGES as a sanity backstop, not a real-world limit — at 100
// tasks/page that's 2000 tasks, comfortably past any real account today.
const MAX_PAGES = 20;

export const getAllTasks = async (extraParams = {}) => {
  const items = [];
  let page = 1;
  while (true) {
    const { data } = await getTasks({ ...extraParams, page, limit: 100 });
    items.push(...(data.items || []));
    if (!data.pagination?.hasMore || page >= MAX_PAGES) break;
    page += 1;
  }
  return items;
};
export const createTask = (task) => api.post('/api/tasks', task);
export const updateTask = (id, task) => api.patch(`/api/tasks/${id}`, task);
export const deleteTask = (id) => api.delete(`/api/tasks/${id}`);
export const searchTasks = (q) => api.get('/api/tasks/search', { params: { q } });
