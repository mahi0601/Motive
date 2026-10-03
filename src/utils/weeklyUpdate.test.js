import { describe, test, expect } from 'vitest';
import { buildWeeklyUpdate } from './weeklyUpdate';

// Wednesday 7 October 2026, midday.
const NOW = new Date('2026-10-07T12:00:00');
const shifted = (offset) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() + offset);
  return d;
};
const day = (offset) => shifted(offset).toISOString();
// A due date is a calendar date, so build it from the local date parts (not the UTC ones).
const pad = (n) => String(n).padStart(2, '0');
const dueOn = (offset) => {
  const d = shifted(offset);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const t = (title, status, extra = {}) => ({ title, status, dueDate: null, completedAt: null, description: 'PRIVATE NOTES', ...extra });
const build = (tasks, opts = {}) => buildWeeklyUpdate({ workspaceName: 'Acme', tasks, milestones: [], now: NOW, ...opts });

describe('buildWeeklyUpdate', () => {
  test('starts with the workspace and the date, and leaves out sections with nothing in them', () => {
    const text = build([t('Fix nav', 'done', { completedAt: day(-1) })]);
    expect(text.split('\n')[0]).toBe('Acme: weekly update, Oct 7');
    expect(text).toMatch(/Shipped this week \(1\)/);
    expect(text).not.toMatch(/In progress/);
    expect(text).not.toMatch(/Overdue/);
    expect(text).not.toMatch(/Coming up/);
  });

  test('shipped means done in the last 7 days, newest first; older and undated done work is left out', () => {
    const text = build([
      t('Older', 'done', { completedAt: day(-5) }),
      t('Newest', 'done', { completedAt: day(-1) }),
      t('Too old', 'done', { completedAt: day(-9) }),
      t('No date', 'done'),
    ]);
    const lines = text.split('\n').filter((l) => l.startsWith('- '));
    expect(lines.map((l) => l.replace(/ \(.*\)$/, ''))).toEqual(['- Newest', '- Older']);
    expect(text).not.toMatch(/Too old|No date/);
  });

  test('in progress work lists its due date; coming up is to-do work due in the next 14 days, soonest first', () => {
    const text = build([
      t('Build API', 'in_progress', { dueDate: dueOn(3) }),
      t('Later task', 'todo', { dueDate: dueOn(10) }),
      t('Sooner task', 'todo', { dueDate: dueOn(2) }),
      t('Far away', 'todo', { dueDate: dueOn(30) }),
      t('Undated todo', 'todo'),
    ]);
    expect(text).toMatch(/In progress \(1\)\n- Build API \(due Oct 10\)/);
    const coming = text.slice(text.indexOf('Coming up'));
    expect(coming.indexOf('Sooner task')).toBeLessThan(coming.indexOf('Later task'));
    expect(text).not.toMatch(/Far away|Undated todo/);
  });

  test('overdue work is listed once, under Overdue, whether it was to do or in progress', () => {
    const text = build([t('Late todo', 'todo', { dueDate: dueOn(-3) }), t('Late doing', 'in_progress', { dueDate: dueOn(-1) })]);
    expect(text).toMatch(/Overdue \(2\)/);
    expect(text).toMatch(/Late todo \(was due Oct 4\)/);
    expect(text.match(/Late doing/g)).toHaveLength(1);
    expect(text).not.toMatch(/In progress/);
  });

  test('something due today is not overdue', () => {
    const text = build([t('Due today', 'todo', { dueDate: dueOn(0) })]);
    expect(text).not.toMatch(/Overdue/);
    expect(text).toMatch(/Coming up/);
  });

  test('done work is never listed as overdue or in progress, even with an old due date', () => {
    const text = build([t('Finished late', 'done', { dueDate: dueOn(-20), completedAt: day(-2) })]);
    expect(text).not.toMatch(/Overdue/);
    expect(text).toMatch(/Shipped this week \(1\)/);
  });

  test('milestones are listed in order with their dates', () => {
    const text = build([], { milestones: [{ title: 'Design sign-off', date: '2026-12-01T00:00:00.000Z' }, { title: 'Launch', date: null }] });
    expect(text).toMatch(/Milestones\n- Design sign-off \(Dec 1, 2026\)\n- Launch/);
  });

  test('only titles and dates are used: descriptions never appear', () => {
    const text = build([t('Fix nav', 'done', { completedAt: day(-1) }), t('Doing', 'in_progress')]);
    expect(text).not.toMatch(/PRIVATE NOTES/);
  });

  test('a long section is cut to 10 with a count of the rest', () => {
    const tasks = Array.from({ length: 13 }, (_, i) => t(`Win ${i}`, 'done', { completedAt: day(-1) }));
    const text = build(tasks);
    expect(text).toMatch(/Shipped this week \(13\)/);
    expect(text.split('\n').filter((l) => l.startsWith('- '))).toHaveLength(10);
    expect(text).toMatch(/and 3 more/);
  });

  test('with nothing to report it says so instead of sending an empty email', () => {
    expect(build([])).toMatch(/Nothing has changed this week/);
  });

  test('titles are used as they are, and a missing title does not break it', () => {
    const text = build([t('<b>Bold</b> & "quoted"', 'done', { completedAt: day(-1) }), { status: 'done', completedAt: day(-1) }]);
    expect(text).toContain('- <b>Bold</b> & "quoted"');
    expect(text).toMatch(/Shipped this week \(2\)/);
  });

  test('task dates carry a year only when it is not this year; milestone dates always do', () => {
    const text = build([t('Very late', 'todo', { dueDate: '2025-12-30' })], { milestones: [{ title: 'M', date: '2027-01-02T00:00:00.000Z' }] });
    expect(text).toMatch(/Very late \(was due Dec 30, 2025\)/);
    expect(text).toMatch(/Milestones\n- M \(Jan 2, 2027\)/);
  });
});
