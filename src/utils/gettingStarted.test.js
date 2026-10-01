import { describe, test, expect, beforeEach } from 'vitest';
import { getSteps, SAMPLE_TASKS, SAMPLE_PAGE_TITLE, isDismissed, dismiss } from './gettingStarted';

const base = { tasks: [], pages: [], workspace: { members: [{ userId: 'u1' }], shareEnabledAt: null }, user: { id: 'u1', emailVerifiedAt: null } };
const done = (steps) => Object.fromEntries(steps.map((s) => [s.id, s.done]));

// Progress is derived from what actually exists, never stored, so it cannot
// claim a step is done when it is not (or lag behind after the user does it).
describe('getSteps', () => {
  test('a brand-new account has nothing done', () => {
    expect(Object.values(done(getSteps(base))).some(Boolean)).toBe(false);
  });

  test('each step is done only by its own real condition', () => {
    expect(done(getSteps({ ...base, tasks: [{ id: 't', title: 'Real' }] }))['first-task']).toBe(true);
    expect(done(getSteps({ ...base, pages: [{ id: 'p', title: 'Brief' }] }))['first-page']).toBe(true);
    expect(done(getSteps({ ...base, workspace: { ...base.workspace, shareEnabledAt: '2026-01-01' } }))['share-status']).toBe(true);
    expect(done(getSteps({ ...base, workspace: { ...base.workspace, members: [{}, {}] } }))['invite']).toBe(true);
    expect(done(getSteps({ ...base, user: { ...base.user, emailVerifiedAt: '2026-01-01' } }))['confirm-email']).toBe(true);
  });

  test('tolerates data that has not loaded yet', () => {
    expect(() => getSteps({ tasks: [], pages: [], workspace: null, user: null })).not.toThrow();
  });

  test('the client status link comes straight after the first task: it is the point of the product', () => {
    expect(getSteps(base).map((s) => s.id).slice(0, 2)).toEqual(['first-task', 'share-status']);
  });
});

describe('the sample project does not count as the user\'s own work', () => {
  test('sample tasks and the sample page leave those steps to do', () => {
    const steps = done(getSteps({ ...base, tasks: SAMPLE_TASKS.map((t, i) => ({ id: i, title: t.title })), pages: [{ id: 'p', title: SAMPLE_PAGE_TITLE }] }));
    expect(steps['first-task']).toBe(false);
    expect(steps['first-page']).toBe(false);
  });
  test('a real task alongside samples does count', () => {
    expect(done(getSteps({ ...base, tasks: [{ id: 1, title: 'Sample: x' }, { id: 2, title: 'Real work' }] }))['first-task']).toBe(true);
  });
});

describe('SAMPLE_TASKS', () => {
  test('are clearly labelled as samples and cover the states a client page shows', () => {
    expect(SAMPLE_TASKS.every((t) => t.title.startsWith('Sample:'))).toBe(true);
    expect(new Set(SAMPLE_TASKS.map((t) => t.status))).toEqual(new Set(['todo', 'in_progress', 'done']));
    const withDue = SAMPLE_TASKS.filter((t) => t.dueInDays != null);
    expect(withDue.length).toBeGreaterThanOrEqual(2);
  });
});

describe('dismissal', () => {
  beforeEach(() => localStorage.clear());
  test('is remembered per user', () => {
    expect(isDismissed('u1')).toBe(false);
    dismiss('u1');
    expect(isDismissed('u1')).toBe(true);
    expect(isDismissed('u2')).toBe(false);
  });
  test('does not throw when storage is unavailable', () => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = () => { throw new Error('blocked'); };
    expect(() => isDismissed('u1')).not.toThrow();
    Storage.prototype.getItem = original;
  });
});
