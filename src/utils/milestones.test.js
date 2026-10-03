import { describe, test, expect } from 'vitest';
import {
  MAX_MILESTONES,
  milestoneRowsFrom,
  publicMilestones,
  defaultMilestoneId,
  toPayload,
  validateRows,
  sameRows,
} from './milestones';

describe('milestoneRowsFrom (the editor starts from what is saved)', () => {
  test('uses the milestone list, keeping ids and trimming the date to YYYY-MM-DD', () => {
    const rows = milestoneRowsFrom({ milestones: [{ id: 'a', title: 'Design', date: '2026-12-01T00:00:00.000Z' }, { id: 'b', title: 'Build', date: null }] });
    expect(rows.map(({ id, title, date }) => ({ id, title, date }))).toEqual([
      { id: 'a', title: 'Design', date: '2026-12-01' },
      { id: 'b', title: 'Build', date: '' },
    ]);
  });

  test('a workspace from a server that predates the list falls back to its single milestone, with no id', () => {
    const rows = milestoneRowsFrom({ milestoneTitle: 'M1', milestoneDate: '2026-12-01T00:00:00.000Z' });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: undefined, title: 'M1', date: '2026-12-01' });
  });

  test('a workspace with no milestones shows one empty row to type into', () => {
    expect(milestoneRowsFrom({ milestones: [] })).toHaveLength(1);
    expect(milestoneRowsFrom({})).toHaveLength(1);
    expect(milestoneRowsFrom({ milestones: [] })[0]).toMatchObject({ title: '', date: '' });
  });

  test('every row has its own stable key', () => {
    const rows = milestoneRowsFrom({ milestones: [{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }] });
    expect(new Set(rows.map((r) => r.key)).size).toBe(2);
  });
});

describe('toPayload', () => {
  test('keeps order and ids, sends a blank date as null, trims titles', () => {
    expect(toPayload([
      { key: 1, id: 'a', title: '  Design ', date: '2026-12-01' },
      { key: 2, id: undefined, title: 'Build', date: '' },
    ])).toEqual([{ id: 'a', title: 'Design', date: '2026-12-01' }, { title: 'Build', date: null }]);
  });

  test('drops rows that are completely empty, so the spare row is not saved', () => {
    expect(toPayload([{ key: 1, title: '', date: '' }, { key: 2, title: ' ', date: '' }])).toEqual([]);
  });

  test('never sends the React key', () => {
    expect(Object.keys(toPayload([{ key: 9, id: 'a', title: 'A', date: '' }])[0]).sort()).toEqual(['date', 'id', 'title']);
  });
});

describe('validateRows', () => {
  test('is fine for named rows and for none at all', () => {
    expect(validateRows([{ title: 'A', date: '' }])).toBe('');
    expect(validateRows([{ title: '', date: '' }])).toBe('');
  });

  test('a date with no name is a mistake worth telling the owner about', () => {
    expect(validateRows([{ title: 'A', date: '' }, { title: '', date: '2026-12-01' }])).toMatch(/milestone 2.*name/i);
  });

  test('refuses more than the limit', () => {
    const rows = Array.from({ length: MAX_MILESTONES + 1 }, (_, i) => ({ title: `M${i}`, date: '' }));
    expect(validateRows(rows)).toMatch(new RegExp(`${MAX_MILESTONES}`));
  });
});

describe('sameRows (is there anything to save?)', () => {
  const a = [{ key: 1, id: 'a', title: 'A', date: '2026-12-01' }, { key: 2, id: 'b', title: 'B', date: '' }];
  test('ignores keys and blank spare rows', () => {
    expect(sameRows(a, [{ key: 8, id: 'a', title: 'A', date: '2026-12-01' }, { key: 9, id: 'b', title: 'B', date: '' }, { key: 10, title: '', date: '' }])).toBe(true);
  });
  test('sees a changed title, a changed date, a different order, a new row and a removed row', () => {
    expect(sameRows(a, [{ ...a[0], title: 'A2' }, a[1]])).toBe(false);
    expect(sameRows(a, [{ ...a[0], date: '2026-12-02' }, a[1]])).toBe(false);
    expect(sameRows(a, [a[1], a[0]])).toBe(false);
    expect(sameRows(a, [...a, { key: 3, title: 'C', date: '' }])).toBe(false);
    expect(sameRows(a, [a[0]])).toBe(false);
  });
  test('trims before comparing, matching what is sent', () => {
    expect(sameRows(a, [{ ...a[0], title: ' A ' }, a[1]])).toBe(true);
  });
});

describe('publicMilestones (what the status page shows)', () => {
  test('uses the list', () => {
    expect(publicMilestones({ milestones: [{ id: 'a', title: 'A' }] })).toEqual([{ id: 'a', title: 'A' }]);
  });
  test('an older server sends only `milestone`, which becomes a list of one', () => {
    expect(publicMilestones({ milestone: { title: 'M', date: null, approvedAt: null } })).toEqual([{ title: 'M', date: null, approvedAt: null }]);
  });
  test('nothing at all is an empty list', () => {
    expect(publicMilestones({})).toEqual([]);
    expect(publicMilestones(undefined)).toEqual([]);
    expect(publicMilestones({ milestone: null })).toEqual([]);
  });
});

describe('defaultMilestoneId (which one a client most likely means)', () => {
  const ms = [{ id: 'a', approvedAt: '2026-10-01' }, { id: 'b', approvedAt: null }, { id: 'c', approvedAt: null }];
  test('is the first one not yet approved', () => expect(defaultMilestoneId(ms)).toBe('b'));
  test('is the first one when all are approved', () => expect(defaultMilestoneId(ms.map((m) => ({ ...m, approvedAt: 'x' })))).toBe('a'));
  test('is undefined when there are none', () => expect(defaultMilestoneId([])).toBeUndefined());
});
