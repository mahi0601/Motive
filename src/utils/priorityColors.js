// Central source of truth for task-priority styling. Previously each of
// PriorityBadge.jsx, TaskForm.jsx, CalendarView.jsx, and EnhancedTaskCard.jsx
// hardcoded its own copy of these classes (mostly stock Tailwind
// yellow-*/purple-*), which is how the brand/spark tokens ended up unused
// almost everywhere. Import from here instead of redefining per component.
//
// High is the "needs attention" priority, so it gets the spark (amber/energy)
// accent; Medium gets the brand (violet) accent; Low is deliberately neutral
// so it doesn't compete visually with the other two.

export const PRIORITY_BADGE_CLASSES = {
  High: 'bg-spark-50 text-spark-700 ring-1 ring-spark-200 dark:bg-spark-900/20 dark:text-spark-300 dark:ring-spark-700',
  Medium: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200 dark:bg-brand-900/20 dark:text-brand-300 dark:ring-brand-700',
  Low: 'bg-light-border/40 text-light-muted ring-1 ring-light-border dark:bg-dark-raised dark:text-dark-muted dark:ring-dark-border',
};

export const PRIORITY_DOT_CLASSES = {
  High: 'bg-spark-500',
  Medium: 'bg-brand-500',
  Low: 'bg-light-muted dark:bg-dark-muted',
};

export const PRIORITY_BORDER_CLASSES = {
  High: 'border-spark-300 dark:border-spark-700/60',
  Medium: 'border-brand-300 dark:border-brand-700/60',
  Low: 'border-light-border dark:border-dark-border',
};

export const getPriorityBadgeClasses = (priority) =>
  PRIORITY_BADGE_CLASSES[priority] || PRIORITY_BADGE_CLASSES.Low;

export const getPriorityDotClass = (priority) =>
  PRIORITY_DOT_CLASSES[priority] || PRIORITY_DOT_CLASSES.Low;

export const getPriorityBorderClass = (priority) =>
  PRIORITY_BORDER_CLASSES[priority] || PRIORITY_BORDER_CLASSES.Low;
