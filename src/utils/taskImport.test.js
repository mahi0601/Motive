import { describe, test, expect } from 'vitest';
import { parseCsv } from './csv';
import { buildImport, parseDate, MAX_IMPORT_ROWS, SAMPLE_CSV } from './taskImport';

const build = (csv) => buildImport(parseCsv(csv));

describe('column detection', () => {
  test('a plain file', () => {
    const r = build('title,description,status,priority,due date,category,tags\nWrite brief,First draft,in progress,high,2026-12-01,Client work,"acme, copy"');
    expect(r.ok).toBe(true);
    expect(r.tasks).toEqual([
      { title: 'Write brief', description: 'First draft', status: 'in_progress', priority: 'High', dueDate: '2026-12-01', category: 'Client work', tags: ['acme', 'copy'] },
    ]);
  });

  test('a Trello-style export (Card Name, List Name, Labels, Due Date, Card Description)', () => {
    const r = build('Card Name,Card Description,List Name,Labels,Due Date\nDesign homepage,Hero + nav,Doing,"Design, Acme",2026-11-05');
    expect(r.tasks[0]).toMatchObject({ title: 'Design homepage', description: 'Hero + nav', status: 'in_progress', tags: ['Design', 'Acme'], dueDate: '2026-11-05' });
  });

  test('a Notion-style export (Name, Status, Priority, Due, Tags)', () => {
    const r = build('Name,Status,Priority,Due,Tags\nLaunch,Not started,Urgent,"Dec 1, 2026",web');
    expect(r.tasks[0]).toMatchObject({ title: 'Launch', status: 'todo', priority: 'High', dueDate: '2026-12-01', tags: ['web'] });
  });

  test('headers are matched ignoring case, spaces, underscores and hyphens, and a BOM', () => {
    const r = build('﻿  TITLE ,Due_Date, STATUS\nA,2026-01-02,Done');
    expect(r.ok).toBe(true);
    expect(r.tasks[0]).toMatchObject({ title: 'A', dueDate: '2026-01-02', status: 'done' });
  });

  test('reports which column was used for what, and which were ignored', () => {
    const r = build('Card Name,Owner,List Name\nA,Bob,Done');
    expect(r.mapping).toEqual([
      { field: 'title', header: 'Card Name' },
      { field: 'status', header: 'List Name' },
    ]);
    expect(r.ignoredHeaders).toEqual(['Owner']);
  });

  test('one column is never used for two fields', () => {
    const r = build('Name,Status\nA,done');
    expect(r.mapping.map((m) => m.header)).toEqual(['Name', 'Status']);
  });

  test('without a title column it says what it looks for', () => {
    const r = build('foo,bar\n1,2');
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/title/i);
    expect(r.error).toMatch(/name/i);
  });

  test('an empty file, and a header with no rows, are explained', () => {
    expect(buildImport([]).ok).toBe(false);
    expect(build('title,status').ok).toBe(false);
    expect(build('title,status').error).toMatch(/no rows/i);
  });

  test('only the fields the server reads are ever produced', () => {
    const r = build('title,id,userId,workspaceId,createdAt\nA,1,2,3,4');
    expect(Object.keys(r.tasks[0]).sort()).toEqual(['category', 'priority', 'status', 'tags', 'title'].sort());
  });
});

describe('defaults match how the app creates a task', () => {
  test('no category means Client work, no priority means Medium, no status means todo', () => {
    const r = build('title\nA');
    expect(r.tasks[0]).toMatchObject({ category: 'Client work', priority: 'Medium', status: 'todo', tags: [] });
    expect(r.tasks[0]).not.toHaveProperty('dueDate');
    expect(r.tasks[0]).not.toHaveProperty('description');
  });
});

describe('statuses', () => {
  test.each([
    ['To do', 'todo'], ['to-do', 'todo'], ['Backlog', 'todo'], ['Open', 'todo'], ['Not started', 'todo'],
    ['In progress', 'in_progress'], ['Doing', 'in_progress'], ['WIP', 'in_progress'], ['In review', 'in_progress'],
    ['Done', 'done'], ['Complete', 'done'], ['Completed', 'done'], ['Closed', 'done'], ['Shipped', 'done'],
  ])('%s becomes %s', (given, expected) => {
    expect(build(`title,status\nA,${given}`).tasks[0].status).toBe(expected);
  });

  test('a status it does not know becomes To do, with one warning that names the values', () => {
    const r = build('title,status\nA,Sprint 12\nB,Sprint 12\nC,Ideas\nD,done');
    expect(r.tasks.map((t) => t.status)).toEqual(['todo', 'todo', 'todo', 'done']);
    expect(r.warnings).toHaveLength(1);
    expect(r.warnings[0]).toMatch(/3 rows/);
    expect(r.warnings[0]).toMatch(/Sprint 12/);
    expect(r.warnings[0]).toMatch(/Ideas/);
  });
});

describe('priorities', () => {
  test.each([['Low', 'Low'], ['minor', 'Low'], ['Medium', 'Medium'], ['normal', 'Medium'], ['High', 'High'], ['Urgent', 'High'], ['critical', 'High']])('%s becomes %s', (given, expected) => {
    expect(build(`title,priority\nA,${given}`).tasks[0].priority).toBe(expected);
  });

  test('one it does not know falls back to Medium, with a warning', () => {
    const r = build('title,priority\nA,whenever');
    expect(r.tasks[0].priority).toBe('Medium');
    expect(r.warnings[0]).toMatch(/priorit/i);
    expect(r.warnings[0]).toMatch(/whenever/);
  });
});

describe('dates are read only when they cannot be mistaken', () => {
  test.each([
    ['2026-12-01', '2026-12-01'],
    ['2026-12-01T09:30:00Z', '2026-12-01'],
    ['2026-12-01 09:30', '2026-12-01'],
    ['2026/12/01', '2026-12-01'],
    ['Dec 1, 2026', '2026-12-01'],
    ['December 1, 2026', '2026-12-01'],
    ['1 Dec 2026', '2026-12-01'],
    ['1st December 2026', '2026-12-01'],
    ['Dec. 1 2026', '2026-12-01'],
  ])('%s is %s', (given, expected) => {
    expect(parseDate(given)).toEqual({ value: expected });
  });

  test.each(['03/04/2026', '3-4-26', 'next tuesday', '2026-02-30', '2026-13-01', '31 Feb 2026', 'soon'])('%s is not guessed at', (given) => {
    expect(parseDate(given)).toEqual({ invalid: true });
  });

  test('blank means none', () => {
    expect(parseDate('')).toEqual({ blank: true });
    expect(parseDate('   ')).toEqual({ blank: true });
  });

  test('an unreadable date is left blank with a warning that names the row and says what is accepted', () => {
    const r = build('title,due date\nA,2026-12-01\nB,03/04/2026');
    expect(r.tasks[1]).not.toHaveProperty('dueDate');
    expect(r.warnings[0]).toMatch(/row 3/i);
    expect(r.warnings[0]).toMatch(/03\/04\/2026/);
    expect(r.warnings[0]).toMatch(/YYYY-MM-DD/);
  });

  test('a completion date is read the same way and only kept for the task\'s own row', () => {
    const r = build('title,status,completed\nA,done,2026-03-04');
    expect(r.tasks[0].completedAt).toBe('2026-03-04');
  });
});

describe('tags', () => {
  test('are split on comma, semicolon or pipe, trimmed and de-duplicated, empty ones dropped', () => {
    const r = build('title,tags\nA,"a, b;c | a, ,"');
    expect(r.tasks[0].tags).toEqual(['a', 'b', 'c']);
  });

  test('keeps at most 50, and drops one over 50 characters, with a warning', () => {
    const many = Array.from({ length: 60 }, (_, i) => `t${i}`).join(',');
    const r = build(`title,tags\nA,"${many},${'x'.repeat(51)}"`);
    expect(r.tasks[0].tags).toHaveLength(50);
    expect(r.warnings.join(' ')).toMatch(/tag/i);
  });
});

describe('rows', () => {
  test('a row with no title is skipped and says which row, counted as in the spreadsheet (header is row 1)', () => {
    const r = build('title,status\nA,done\n,done\nC,done');
    expect(r.tasks.map((t) => t.title)).toEqual(['A', 'C']);
    expect(r.skipped).toEqual([{ line: 3, reason: 'No title' }]);
  });

  test('completely blank rows are ignored without a fuss', () => {
    const r = build('title\nA\n\n,\nB');
    expect(r.tasks.map((t) => t.title)).toEqual(['A', 'B']);
    expect(r.skipped).toEqual([]);
  });

  test('a title over 500 characters is skipped, with the reason', () => {
    const r = build(`title\n${'x'.repeat(501)}\nok`);
    expect(r.tasks.map((t) => t.title)).toEqual(['ok']);
    expect(r.skipped[0]).toMatchObject({ line: 2, reason: expect.stringMatching(/500/) });
  });

  test('a description over 10,000 characters is shortened, with a warning, not dropped', () => {
    const r = build(`title,description\nA,${'y'.repeat(10010)}`);
    expect(r.tasks[0].description).toHaveLength(10000);
    expect(r.warnings.join(' ')).toMatch(/10,000/);
  });

  test('titles and text are trimmed', () => {
    expect(build('title,description\n  A  ,  d  ').tasks[0]).toMatchObject({ title: 'A', description: 'd' });
  });

  test('a short row (fewer cells than headers) is fine', () => {
    expect(build('title,status,priority\nA').tasks[0]).toMatchObject({ title: 'A', status: 'todo' });
  });

  test('control characters are removed from every field, and a title that is only control characters has no title', () => {
    const r = build('title,description\nA\u0000B,x\u0007y\n\u0007\u0000,z');
    expect(r.tasks[0]).toMatchObject({ title: 'AB', description: 'xy' });
    expect(r.skipped).toEqual([{ line: 3, reason: 'No title' }]);
  });

  test('markup is just text', () => {
    expect(build('title\n<img src=x onerror=alert(1)>').tasks[0].title).toBe('<img src=x onerror=alert(1)>');
  });

  test('exactly 500 rows is fine and 501 asks for the file to be split', () => {
    const rows = (n) => `title\n${Array.from({ length: n }, (_, i) => `T${i}`).join('\n')}`;
    expect(MAX_IMPORT_ROWS).toBe(500);
    expect(build(rows(500)).ok).toBe(true);
    const over = build(rows(501));
    expect(over.ok).toBe(false);
    expect(over.error).toMatch(/501/);
    expect(over.error).toMatch(/500/);
  });

  test('items keep their row numbers, so a server error can be traced back', () => {
    const r = build('title\nA\n\nB');
    expect(r.items.map((i) => i.line)).toEqual([2, 4]);
  });
});

describe('the sample file', () => {
  test('imports cleanly with every column recognised and no warnings', () => {
    const r = build(SAMPLE_CSV);
    expect(r.ok).toBe(true);
    expect(r.tasks.length).toBeGreaterThanOrEqual(3);
    expect(r.skipped).toEqual([]);
    expect(r.warnings).toEqual([]);
    expect(r.ignoredHeaders).toEqual([]);
  });
});
