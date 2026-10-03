// The example client page shown at /demo, so a visitor can see what their client would
// see without signing up. It has the same shape the real public endpoint returns and is
// rendered by the real page component, so it cannot drift from the product. Everything
// is made up and says so. Dates are relative to now, so the page never looks stale.
const DAY = 24 * 60 * 60 * 1000;

export const buildDemoStatus = (now = new Date()) => {
  const at = (days) => new Date(now.getTime() + days * DAY).toISOString();

  const tasks = [
    { title: 'Send revised logo files', status: 'todo', dueDate: at(-2), completedAt: null }, // overdue
    { title: 'Share the copy deck for review', status: 'todo', dueDate: at(1), completedAt: null }, // at risk
    { title: 'Homepage design, round 2', status: 'in_progress', dueDate: at(6), completedAt: null },
    { title: 'Social media templates', status: 'in_progress', dueDate: null, completedAt: null },
    { title: 'Menu board artwork', status: 'todo', dueDate: at(14), completedAt: null },
    { title: 'Packaging mockups', status: 'todo', dueDate: at(21), completedAt: null },
    { title: 'Moodboard approved', status: 'done', dueDate: null, completedAt: at(-1) },
    { title: 'Colour palette', status: 'done', dueDate: null, completedAt: at(-3) },
    { title: 'Logo concepts', status: 'done', dueDate: null, completedAt: at(-9) },
    { title: 'Brand questionnaire', status: 'done', dueDate: null, completedAt: at(-20) },
  ];

  const count = (status) => tasks.filter((t) => t.status === status).length;
  const done = count('done');
  const recentDone = tasks
    .filter((t) => t.status === 'done' && now.getTime() - new Date(t.completedAt).getTime() <= 7 * DAY)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

  const milestones = [
    { id: 'demo-1', title: 'Brand direction sign-off', date: at(-6), approvedAt: at(-5) },
    { id: 'demo-2', title: 'Homepage design approved', date: at(9), approvedAt: null },
    { id: 'demo-3', title: 'Launch', date: at(30), approvedAt: null },
  ];

  // Tasks finished in each of the last 8 weeks (Monday to Sunday, UTC), oldest first, the
  // last being this week so far. Made up, but shaped like the real thing.
  const weekStart = (daysBack) => {
    const d = new Date(now.getTime() - daysBack * DAY);
    const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - ((d.getUTCDay() + 6) % 7) * DAY);
    return monday.toISOString().slice(0, 10);
  };
  const thisMonday = weekStart(0);
  const counts = [1, 2, 0, 3, 2, 4, 3, 2];
  const throughput = {
    weeks: counts.length,
    items: counts.map((count, i) => ({
      start: new Date(new Date(`${thisMonday}T00:00:00Z`).getTime() - (counts.length - 1 - i) * 7 * DAY).toISOString().slice(0, 10),
      count,
    })),
  };

  return {
    workspace: { name: 'Example Co. website redesign', icon: '🧭' },
    page: {
      headline: 'Website redesign for Example Co.',
      summary: 'Phase 2 of 3: homepage design and print materials. The logo and colours are signed off. This page is an example with made-up data.',
      milestones,
      milestone: milestones[0],
      accent: 'teal',
      hideBranding: false,
      allowFeedback: true,
    },
    summary: { todo: count('todo'), in_progress: count('in_progress'), done, total: tasks.length, percent: Math.round((done / tasks.length) * 100) },
    throughput,
    recent: { days: 7, count: recentDone.length, items: recentDone.map((t) => ({ title: t.title, completedAt: t.completedAt })) },
    tasks,
    truncated: false,
  };
};
