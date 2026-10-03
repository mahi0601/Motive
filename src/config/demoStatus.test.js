import { describe, test, expect } from 'vitest';
import { buildDemoStatus } from './demoStatus';

const NOW = new Date('2026-10-07T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
const demo = () => buildDemoStatus(NOW);

describe('buildDemoStatus (the example page on the landing site)', () => {
  test('has the same shape the real public endpoint returns', () => {
    const d = demo();
    expect(Object.keys(d).sort()).toEqual(['page', 'recent', 'summary', 'tasks', 'truncated', 'workspace']);
    expect(Object.keys(d.page).sort()).toEqual(['accent', 'allowFeedback', 'headline', 'hideBranding', 'milestone', 'milestones', 'summary']);
    expect(d.truncated).toBe(false);
  });

  test('is plainly an example, not a real client', () => {
    const text = JSON.stringify(demo());
    expect(text).toMatch(/example/i);
  });

  test('its summary agrees with its tasks', () => {
    const d = demo();
    const count = (s) => d.tasks.filter((t) => t.status === s).length;
    expect(d.summary).toMatchObject({ todo: count('todo'), in_progress: count('in_progress'), done: count('done'), total: d.tasks.length });
    expect(d.summary.percent).toBe(Math.round((count('done') / d.tasks.length) * 100));
  });

  test('shows every state a client sees: overdue, in flight, not started and shipped', () => {
    const d = demo();
    expect(d.tasks.some((t) => t.status === 'todo' && t.dueDate && new Date(t.dueDate) < NOW)).toBe(true); // overdue
    expect(d.tasks.some((t) => t.status === 'in_progress')).toBe(true);
    expect(d.tasks.some((t) => t.status === 'todo' && (!t.dueDate || new Date(t.dueDate) > NOW))).toBe(true);
    expect(d.tasks.some((t) => t.status === 'done')).toBe(true);
  });

  test('dates are relative to now, so the page never looks stale', () => {
    const later = buildDemoStatus(new Date(NOW.getTime() + 400 * DAY));
    const overdue = (d, now) => d.tasks.some((t) => t.status === 'todo' && t.dueDate && new Date(t.dueDate) < now);
    expect(overdue(later, new Date(NOW.getTime() + 400 * DAY))).toBe(true);
    expect(new Date(later.recent.items[0].completedAt).getTime()).toBeGreaterThan(NOW.getTime() + 390 * DAY);
  });

  test('"shipped this week" is really within the last 7 days and agrees with the done tasks', () => {
    const d = demo();
    expect(d.recent.days).toBe(7);
    expect(d.recent.count).toBe(d.recent.items.length);
    for (const item of d.recent.items) {
      const age = NOW.getTime() - new Date(item.completedAt).getTime();
      expect(age).toBeGreaterThanOrEqual(0);
      expect(age).toBeLessThanOrEqual(7 * DAY);
      expect(d.tasks.some((t) => t.title === item.title && t.status === 'done')).toBe(true);
    }
    expect(d.recent.items.map((i) => i.completedAt)).toEqual([...d.recent.items.map((i) => i.completedAt)].sort().reverse());
  });

  test('has several milestones, one already approved, in order, and responses switched on', () => {
    const d = demo();
    expect(d.page.milestones.length).toBeGreaterThanOrEqual(3);
    expect(d.page.milestones[0].approvedAt).toBeTruthy();
    expect(d.page.milestones.slice(1).every((m) => !m.approvedAt)).toBe(true);
    expect(d.page.milestone).toEqual(d.page.milestones[0]);
    expect(d.page.allowFeedback).toBe(true);
    expect(d.page.hideBranding).toBe(false);
  });

  test('every milestone id is unique and none looks like a real id', () => {
    const ids = demo().page.milestones.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.startsWith('demo-'))).toBe(true);
  });
});
