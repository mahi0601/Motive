// Plain text for "here is what moved this week", for an owner to paste into an email
// or a message. Titles and dates only, never descriptions, matching what the client
// status page shows. Sections with nothing in them are left out, and a long one is cut
// to MAX_ITEMS with a count of the rest.
const MAX_ITEMS = 10;
const SHIPPED_DAYS = 7;
const COMING_UP_DAYS = 14;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad = (n) => String(n).padStart(2, '0');
const localDateString = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// "Oct 7", or "Dec 30, 2025" when the year is not this one (or always, with `withYear`).
// `ymd` is a calendar date, as stored for a due date.
const formatYmd = (ymd, thisYear, withYear = false) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}${withYear || y !== thisYear ? `, ${y}` : ''}`;
};

const titleOf = (task) => String(task.title ?? '').trim() || 'Untitled';
const dueOf = (task) => (task.dueDate ? String(task.dueDate).slice(0, 10) : null);

export const buildWeeklyUpdate = ({ workspaceName, tasks = [], milestones = [], now = new Date() }) => {
  const thisYear = now.getFullYear();
  const today = localDateString(now);
  const comingUpEnd = localDateString(new Date(now.getFullYear(), now.getMonth(), now.getDate() + COMING_UP_DAYS));
  const shippedSince = new Date(now.getTime() - SHIPPED_DAYS * 24 * 60 * 60 * 1000);
  const fmt = (ymd, withYear) => formatYmd(ymd, thisYear, withYear);

  const open = tasks.filter((t) => t.status !== 'done');
  const overdue = open.filter((t) => dueOf(t) && dueOf(t) < today).sort((a, b) => dueOf(a).localeCompare(dueOf(b)));
  const isOverdue = new Set(overdue);

  const shipped = tasks
    .filter((t) => t.status === 'done' && t.completedAt && new Date(t.completedAt) >= shippedSince)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  const inProgress = open.filter((t) => t.status === 'in_progress' && !isOverdue.has(t));
  const comingUp = open
    .filter((t) => t.status !== 'in_progress' && !isOverdue.has(t) && dueOf(t) && dueOf(t) >= today && dueOf(t) <= comingUpEnd)
    .sort((a, b) => dueOf(a).localeCompare(dueOf(b)));

  const section = (title, list, describe) => {
    if (!list.length) return null;
    const lines = list.slice(0, MAX_ITEMS).map((t) => `- ${titleOf(t)}${describe(t) ? ` (${describe(t)})` : ''}`);
    if (list.length > MAX_ITEMS) lines.push(`and ${list.length - MAX_ITEMS} more`);
    return [`${title} (${list.length})`, ...lines].join('\n');
  };

  const sections = [
    section('Shipped this week', shipped, (t) => `done ${fmt(localDateString(new Date(t.completedAt)))}`),
    section('In progress', inProgress, (t) => (dueOf(t) ? `due ${fmt(dueOf(t))}` : '')),
    section('Coming up in the next 2 weeks', comingUp, (t) => `due ${fmt(dueOf(t))}`),
    section('Overdue', overdue, (t) => `was due ${fmt(dueOf(t))}`),
  ].filter(Boolean);
  if (!sections.length) sections.push('Nothing has changed this week.');

  const dated = milestones.filter((m) => m?.title);
  if (dated.length) {
    sections.push(
      ['Milestones', ...dated.map((m) => `- ${String(m.title).trim()}${m.date ? ` (${fmt(String(m.date).slice(0, 10), true)})` : ''}`)].join('\n')
    );
  }

  return [`${workspaceName || 'Project'}: weekly update, ${fmt(today).replace(/, \d{4}$/, '')}`, '', sections.join('\n\n')].join('\n');
};
