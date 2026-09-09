// Single source of truth for the task category list — previously the board
// (Dashboard.jsx) and the task form (TaskForm.jsx) each hardcoded their own
// list and had drifted apart (the form offered a "Work" category that had no
// column on the board, so a task saved as "Work" was created but never
// visible anywhere).
export const TASK_CATEGORIES = ['Personal', 'Finance', 'Health', 'Development'];

export const TASK_PRIORITIES = ['Low', 'Medium', 'High'];
