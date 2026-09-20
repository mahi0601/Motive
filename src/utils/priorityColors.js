// Central source of truth for task-priority styling. Previously each of
// PriorityBadge.jsx, TaskForm.jsx, CalendarView.jsx, and EnhancedTaskCard.jsx
// hardcoded its own copy of these classes (mostly stock Tailwind
// yellow-*/purple-*), which is how the brand/spark tokens ended up unused
// almost everywhere. Import from here instead of redefining per component.
//
// Priority is expressed by WEIGHT within the brand petrol ramp, not by a
// separate hue (the old system gave High its own amber "spark" accent).
// Hue is reserved exclusively for delivery STATE (see statusColors.js) — a
// High-priority task and an At-risk task must never look the same just
// because they're both "important." So: hue answers "where does this
// stand," weight answers "how much does this matter." Two independent
// channels, not one hue doing both jobs.

export const PRIORITY_BADGE_CLASSES = {
  High: 'bg-brand-700 text-white ring-1 ring-brand-800 dark:bg-brand-600 dark:text-white dark:ring-brand-500',
  Medium: 'bg-brand-100 text-brand-700 ring-1 ring-brand-200 dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-700',
  Low: 'bg-light-border/40 text-light-muted ring-1 ring-light-border dark:bg-dark-raised dark:text-dark-muted dark:ring-dark-border',
};

export const PRIORITY_DOT_CLASSES = {
  High: 'bg-brand-700 dark:bg-brand-500',
  Medium: 'bg-brand-400',
  Low: 'bg-light-muted dark:bg-dark-muted',
};

export const PRIORITY_BORDER_CLASSES = {
  High: 'border-brand-700 dark:border-brand-500',
  Medium: 'border-brand-300 dark:border-brand-700/60',
  Low: 'border-light-border dark:border-dark-border',
};

export const getPriorityBadgeClasses = (priority) =>
  PRIORITY_BADGE_CLASSES[priority] || PRIORITY_BADGE_CLASSES.Low;

export const getPriorityDotClass = (priority) =>
  PRIORITY_DOT_CLASSES[priority] || PRIORITY_DOT_CLASSES.Low;

export const getPriorityBorderClass = (priority) =>
  PRIORITY_BORDER_CLASSES[priority] || PRIORITY_BORDER_CLASSES.Low;
