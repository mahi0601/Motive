// Central source of truth for delivery-STATE styling — shipped / in flight /
// at risk / overdue / not started. Mirrors the structure of priorityColors.js
// deliberately, but is a genuinely new map: before this file, status color
// was scattered across a 3-tone inline object in Momentum.jsx, a hardcoded
// `text-green-500` in EnhancedTaskCard.jsx, and copy-pasted stock Tailwind
// red/green/emerald classes in ~15 other files (see PLAN "Petrol & Ink" §3).
//
// This is the one place hue is allowed to mean "state." `brand` (petrol)
// must never be reused here — the whole point of the redesign is that the
// brand accent no longer competes with what a client actually needs to read
// at a glance. Priority is expressed by weight in the brand ramp instead
// (see priorityColors.js), keeping "how much this matters" and "where this
// stands" as two independent visual channels.
//
// Rule: never color alone. Shipped (green) vs Overdue (red) is exactly the
// red/green collision ~8% of men with color vision deficiency can't
// reliably tell apart, and a client viewing a shared status link is an
// uncontrolled population. Every consumer of this map must also render the
// paired icon and label — STATUS_ICON exists so that's easy to do
// consistently rather than each screen picking its own icon.

import { CheckCircle2, ListTodo, AlertTriangle, Clock, Circle } from 'lucide-react';

export const STATUS = {
  SHIPPED: 'shipped',
  IN_FLIGHT: 'in_flight',
  AT_RISK: 'at_risk',
  OVERDUE: 'overdue',
  NOT_STARTED: 'not_started',
};

// Maps the backend's task/momentum vocabulary (done/in_progress/todo, plus
// momentum.service.js's overdue/at-risk derivations) onto the STATUS enum
// above, so callers can pass either shape without duplicating the mapping.
const ALIASES = {
  done: STATUS.SHIPPED,
  shipped: STATUS.SHIPPED,
  in_progress: STATUS.IN_FLIGHT,
  'in-progress': STATUS.IN_FLIGHT,
  in_flight: STATUS.IN_FLIGHT,
  'at-risk': STATUS.AT_RISK,
  at_risk: STATUS.AT_RISK,
  overdue: STATUS.OVERDUE,
  todo: STATUS.NOT_STARTED,
  not_started: STATUS.NOT_STARTED,
};

const normalize = (status) => ALIASES[status] || STATUS.NOT_STARTED;

export const STATUS_LABEL = {
  [STATUS.SHIPPED]: 'Shipped',
  [STATUS.IN_FLIGHT]: 'In flight',
  [STATUS.AT_RISK]: 'At risk',
  [STATUS.OVERDUE]: 'Overdue',
  [STATUS.NOT_STARTED]: 'Not started',
};

export const STATUS_ICON = {
  [STATUS.SHIPPED]: CheckCircle2,
  [STATUS.IN_FLIGHT]: ListTodo,
  [STATUS.AT_RISK]: AlertTriangle,
  [STATUS.OVERDUE]: Clock,
  [STATUS.NOT_STARTED]: Circle,
};

// Solid text/icon color — for a tile's icon chip, a status dot, a chart bar.
export const STATUS_TEXT_CLASSES = {
  [STATUS.SHIPPED]: 'text-semantic-success-500 dark:text-semantic-success-dark',
  [STATUS.IN_FLIGHT]: 'text-semantic-info-500 dark:text-semantic-info-dark',
  [STATUS.AT_RISK]: 'text-semantic-warning-500 dark:text-semantic-warning-dark',
  [STATUS.OVERDUE]: 'text-semantic-danger-500 dark:text-semantic-danger-dark',
  [STATUS.NOT_STARTED]: 'text-semantic-idle-500 dark:text-semantic-idle-dark',
};

// Soft badge/chip background + text + ring — for the Momentum tile icon
// chips and any status pill.
export const STATUS_BADGE_CLASSES = {
  [STATUS.SHIPPED]: 'bg-semantic-success-50 text-semantic-success-500 ring-1 ring-semantic-success-200 dark:bg-semantic-success-500/10 dark:text-semantic-success-dark dark:ring-semantic-success-500/30',
  [STATUS.IN_FLIGHT]: 'bg-semantic-info-50 text-semantic-info-500 ring-1 ring-semantic-info-200 dark:bg-semantic-info-500/10 dark:text-semantic-info-dark dark:ring-semantic-info-500/30',
  [STATUS.AT_RISK]: 'bg-semantic-warning-50 text-semantic-warning-500 ring-1 ring-semantic-warning-200 dark:bg-semantic-warning-500/10 dark:text-semantic-warning-dark dark:ring-semantic-warning-500/30',
  [STATUS.OVERDUE]: 'bg-semantic-danger-50 text-semantic-danger-500 ring-1 ring-semantic-danger-200 dark:bg-semantic-danger-500/10 dark:text-semantic-danger-dark dark:ring-semantic-danger-500/30',
  [STATUS.NOT_STARTED]: 'bg-semantic-idle-50 text-semantic-idle-500 ring-1 ring-semantic-idle-200 dark:bg-semantic-idle-500/10 dark:text-semantic-idle-dark dark:ring-semantic-idle-500/30',
};

// Solid dot — for compact chart legends / task-card status markers.
export const STATUS_DOT_CLASSES = {
  [STATUS.SHIPPED]: 'bg-semantic-success-500',
  [STATUS.IN_FLIGHT]: 'bg-semantic-info-500',
  [STATUS.AT_RISK]: 'bg-semantic-warning-500',
  [STATUS.OVERDUE]: 'bg-semantic-danger-500',
  [STATUS.NOT_STARTED]: 'bg-semantic-idle-500',
};

// Literal hex, for recharts fills/strokes (which read presentation
// attributes, not Tailwind classes — see chartColors.js's own note on this).
export const STATUS_HEX = {
  [STATUS.SHIPPED]: { light: '#16A34A', dark: '#4ADE80' },
  [STATUS.IN_FLIGHT]: { light: '#3B82F6', dark: '#60A5FA' },
  [STATUS.AT_RISK]: { light: '#E8A317', dark: '#FBBF24' },
  [STATUS.OVERDUE]: { light: '#D64545', dark: '#F87171' },
  [STATUS.NOT_STARTED]: { light: '#94A3B8', dark: '#64748B' },
};

// 48h — kept in sync with Dashboard.jsx's AT_RISK_WINDOW_MS and the
// backend's momentum.service.js so "at risk" means the same window
// everywhere a task's urgency is displayed.
const AT_RISK_WINDOW_MS = 48 * 60 * 60 * 1000;

// Derives a task's display STATUS from its raw `status`/`dueDate` fields —
// the same shipped/in-flight/at-risk/overdue/not-started logic already
// inlined in Dashboard.jsx's matchesHighlight, exported here so any other
// screen (Calendar, eventually a client-facing view) can read a task's
// status the same way without duplicating the derivation.
export const getTaskDisplayStatus = (task) => {
  if (task.status === 'done' || task.completed) return STATUS.SHIPPED;
  if (task.dueDate) {
    const due = new Date(task.dueDate).getTime();
    const now = Date.now();
    if (due < now) return STATUS.OVERDUE;
    if (due - now <= AT_RISK_WINDOW_MS) return STATUS.AT_RISK;
  }
  return task.status === 'in_progress' ? STATUS.IN_FLIGHT : STATUS.NOT_STARTED;
};

export const getStatusLabel = (status) => STATUS_LABEL[normalize(status)];
export const getStatusIcon = (status) => STATUS_ICON[normalize(status)];
export const getStatusTextClasses = (status) => STATUS_TEXT_CLASSES[normalize(status)];
export const getStatusBadgeClasses = (status) => STATUS_BADGE_CLASSES[normalize(status)];
export const getStatusDotClass = (status) => STATUS_DOT_CLASSES[normalize(status)];
export const getStatusHex = (status, isDark) => STATUS_HEX[normalize(status)][isDark ? 'dark' : 'light'];
