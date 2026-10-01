// What a new account should do first, in the order that gets it to the point of
// the product: a client opening a live status link. Every step's "done" is read
// from real data each time (tasks, pages, the workspace, the user), never
// stored, so the checklist cannot say something is done when it is not.
//
// The sample project does not count: "add your first task" means one of your
// own, so a user who only has the sample still sees it as to do.
const isSample = (title) => typeof title === 'string' && title.startsWith('Sample:');

export const getSteps = ({ tasks = [], pages = [], workspace, user }) => [
  { id: 'first-task', label: 'Add your first task', done: tasks.some((t) => !isSample(t.title)) },
  { id: 'share-status', label: 'Share a live status link with a client', done: !!workspace?.shareEnabledAt },
  { id: 'first-page', label: 'Write a project brief page', done: pages.some((p) => !isSample(p.title)) },
  { id: 'confirm-email', label: 'Confirm your email address', done: !!user?.emailVerifiedAt },
  { id: 'invite', label: 'Invite a teammate', done: (workspace?.members?.length ?? 1) > 1 },
];

// A small client project covering every state the status page shows: finished,
// in progress, due soon, and later. Clearly labelled so it is easy to delete.
export const SAMPLE_TASKS = [
  { title: 'Sample: Kick-off call with client', status: 'done', priority: 'Medium', dueInDays: null },
  { title: 'Sample: Draft homepage design', status: 'in_progress', priority: 'High', dueInDays: 2 },
  { title: 'Sample: Client feedback round 1', status: 'todo', priority: 'Medium', dueInDays: 5 },
  { title: 'Sample: Final handover', status: 'todo', priority: 'Low', dueInDays: 14 },
];

export const SAMPLE_PAGE_TITLE = 'Sample: Project brief';

// "YYYY-MM-DD", the format the task API and date inputs use.
export const dateInDays = (days, from = new Date()) => {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

// Per-user, per-browser convenience only: nothing depends on it, so a blocked
// or unavailable localStorage just means the card keeps showing.
const key = (userId) => `motive_getting_started_hidden_${userId}`;
export const isDismissed = (userId) => {
  try {
    return localStorage.getItem(key(userId)) === 'true';
  } catch {
    return false;
  }
};
export const dismiss = (userId) => {
  try {
    localStorage.setItem(key(userId), 'true');
  } catch {
    /* storage unavailable — the card will simply show again */
  }
};
