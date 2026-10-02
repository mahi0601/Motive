// Single source of truth for the task category list — previously the board
// (Dashboard.jsx) and the task form (TaskForm.jsx) each hardcoded their own
// list and had drifted apart (the form offered a "Work" category that had no
// column on the board, so a task saved as "Work" was created but never
// visible anywhere).
// Agency-first: the product is for teams running client work. "Personal" stays
// for solo use. Tasks saved earlier under Finance/Health/Development keep that
// category — `categoryOptions` adds it back to the picker when such a task is
// edited, so changing the list never loses or rewrites anyone's data.
export const TASK_CATEGORIES = ['Client work', 'Internal', 'Admin', 'Sales', 'Personal'];
export const DEFAULT_TASK_CATEGORY = 'Client work';

export const categoryOptions = (current) =>
  current && !TASK_CATEGORIES.includes(current) ? [...TASK_CATEGORIES, current] : [...TASK_CATEGORIES];

export const TASK_PRIORITIES = ['Low', 'Medium', 'High'];
