// Turns the rows of a CSV into tasks for the import endpoint, and says plainly what
// it did: which column became what, which rows were skipped and why, and what it had
// to guess. It never guesses a date (03/04/2026 is March or April depending on who
// wrote it), so only unambiguous formats are read and the rest is left blank with a
// warning. The result only ever contains fields the server reads.
import { DEFAULT_TASK_CATEGORY } from './constants';

export const MAX_IMPORT_ROWS = 500;
const MAX_TITLE = 500;
const MAX_DESCRIPTION = 10000;
const MAX_TAGS = 50;
const MAX_TAG = 50;
const MAX_CATEGORY = 100;
const DEFAULT_PRIORITY = 'Medium';

// What each field is called in the tools people export from (Trello, Notion, Asana,
// spreadsheets). Earlier names win when a file has more than one.
const ALIASES = {
  title: ['title', 'name', 'task', 'task name', 'card name', 'card', 'summary', 'subject', 'item'],
  description: ['description', 'notes', 'details', 'card description', 'body', 'note'],
  status: ['status', 'state', 'list', 'list name', 'column', 'stage', 'section', 'progress'],
  priority: ['priority', 'importance', 'urgency'],
  dueDate: ['due date', 'due', 'deadline', 'due on', 'date due', 'target date'],
  completedAt: ['completed', 'completed date', 'date completed', 'completed at', 'done date', 'closed date', 'date done'],
  category: ['category', 'project', 'type', 'area'],
  tags: ['tags', 'labels', 'label', 'tag'],
};
const FIELDS = Object.keys(ALIASES);

const norm = (s) => String(s ?? '').toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();

const STATUS = {
  todo: ['todo', 'to do', 'backlog', 'open', 'not started', 'new', 'planned', 'queued', 'pending', 'next'],
  in_progress: ['in progress', 'doing', 'started', 'wip', 'in review', 'review', 'active', 'working', 'ongoing', 'in development', 'in dev'],
  done: ['done', 'complete', 'completed', 'closed', 'finished', 'shipped', 'resolved', 'delivered'],
};
const PRIORITY = {
  High: ['high', 'urgent', 'critical', 'highest', 'p0', 'p1'],
  Medium: ['medium', 'med', 'normal', 'moderate', 'p2'],
  Low: ['low', 'minor', 'lowest', 'p3', 'p4'],
};
const invert = (table) => Object.fromEntries(Object.entries(table).flatMap(([value, names]) => names.map((n) => [n, value])));
const STATUS_OF = invert(STATUS);
const PRIORITY_OF = invert(PRIORITY);

const MONTH_NAMES = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const MONTH_ABBREVIATIONS = { jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };
// "Dec", "Sept" and "December" are months; a word that merely starts like one is not.
const monthOf = (name) => {
  const n = name.toLowerCase();
  const full = MONTH_NAMES.indexOf(n);
  return full !== -1 ? full + 1 : MONTH_ABBREVIATIONS[n] ?? null;
};

const pad = (n) => String(n).padStart(2, '0');
const valid = (y, m, d) => {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d ? { value: `${y}-${pad(m)}-${pad(d)}` } : { invalid: true };
};

// { value: 'YYYY-MM-DD' } | { blank: true } | { invalid: true }
export const parseDate = (raw) => {
  const s = String(raw ?? '').trim();
  if (!s) return { blank: true };
  let m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/.exec(s) || /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(s);
  if (m) return valid(+m[1], +m[2], +m[3]);
  m = /^([A-Za-z]{3,9})\.? (\d{1,2})(?:st|nd|rd|th)?,? (\d{4})$/.exec(s);
  if (m && monthOf(m[1])) return valid(+m[3], monthOf(m[1]), +m[2]);
  m = /^(\d{1,2})(?:st|nd|rd|th)? ([A-Za-z]{3,9})\.?,? (\d{4})$/.exec(s);
  if (m && monthOf(m[2])) return valid(+m[3], monthOf(m[2]), +m[1]);
  return { invalid: true };
};

const isBlankRow = (r) => r.every((c) => String(c).trim() === '');

// Control characters (a NUL is rejected by the database) are dropped; tab, newline and
// carriage return stay. Done here as well as on the server so a title that is only
// control characters is skipped under its own spreadsheet row number.
const isControl = (ch) => {
  const code = ch.charCodeAt(0);
  return (code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127;
};
const clean = (v) => [...String(v ?? '')].filter((ch) => !isControl(ch)).join('');
const quote = (values) => values.slice(0, 3).map((v) => `“${v}”`).join(', ');
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export const SAMPLE_CSV = [
  'title,description,status,priority,due date,category,tags',
  'Kick-off call with the client,Agree scope and timeline,done,High,2026-10-01,Client work,"acme, onboarding"',
  'Write the project brief,First draft for review,in progress,Medium,2026-10-08,Client work,acme',
  'Send the first invoice,,to do,Low,2026-10-15,Admin,',
].join('\n');

// `table` is the array of records from parseCsv, header first. Row numbers are the
// spreadsheet's (the header is row 1).
export const buildImport = (table) => {
  if (!table.length) return { ok: false, error: 'The file is empty.' };
  const headers = table[0].map((h) => String(h).trim());
  const normalised = headers.map(norm);

  // field -> column index, taking each column at most once, title first.
  const column = {};
  const used = new Set();
  for (const field of FIELDS) {
    for (const alias of ALIASES[field]) {
      const idx = normalised.findIndex((h, i) => h === alias && !used.has(i));
      if (idx !== -1) {
        column[field] = idx;
        used.add(idx);
        break;
      }
    }
  }
  if (column.title === undefined) {
    return { ok: false, error: `Could not find a title column. Name one of the columns Title, Name, Task or Card Name (found: ${headers.filter(Boolean).slice(0, 8).join(', ') || 'no headers'}).` };
  }

  const body = table.slice(1).map((cells, i) => ({ cells, line: i + 2 })).filter((r) => !isBlankRow(r.cells));
  if (!body.length) return { ok: false, error: 'The file has no rows to import under the header.' };
  if (body.length > MAX_IMPORT_ROWS) {
    return { ok: false, error: `This file has ${body.length} rows and up to ${MAX_IMPORT_ROWS} can be imported at a time. Split it into parts and import them one after another.` };
  }

  const cell = (cells, field) => (column[field] === undefined ? '' : clean(cells[column[field]]).trim());

  const problems = { status: [], priority: [], date: [], tags: 0, descriptions: 0 };
  const items = body.map(({ cells, line }) => {
    const title = cell(cells, 'title');
    if (!title) return { line, task: null, skip: 'No title' };
    if (title.length > MAX_TITLE) return { line, task: null, skip: `Title is longer than ${MAX_TITLE} characters` };

    const task = { title };

    const description = cell(cells, 'description');
    if (description) {
      if (description.length > MAX_DESCRIPTION) problems.descriptions += 1;
      task.description = description.slice(0, MAX_DESCRIPTION);
    }

    const rawStatus = cell(cells, 'status');
    if (!rawStatus) task.status = 'todo';
    else if (STATUS_OF[norm(rawStatus)]) task.status = STATUS_OF[norm(rawStatus)];
    else {
      task.status = 'todo';
      problems.status.push(rawStatus);
    }

    const rawPriority = cell(cells, 'priority');
    if (!rawPriority) task.priority = DEFAULT_PRIORITY;
    else if (PRIORITY_OF[norm(rawPriority)]) task.priority = PRIORITY_OF[norm(rawPriority)];
    else {
      task.priority = DEFAULT_PRIORITY;
      problems.priority.push(rawPriority);
    }

    for (const [field, key] of [['dueDate', 'dueDate'], ['completedAt', 'completedAt']]) {
      const raw = cell(cells, field);
      const parsed = parseDate(raw);
      if (parsed.value) task[key] = parsed.value;
      else if (parsed.invalid) problems.date.push({ line, raw });
    }

    task.category = cell(cells, 'category').slice(0, MAX_CATEGORY) || DEFAULT_TASK_CATEGORY;

    const tags = [];
    for (const t of cell(cells, 'tags').split(/[,;|]/).map((x) => x.trim()).filter(Boolean)) {
      if (t.length > MAX_TAG) problems.tags += 1;
      else if (!tags.includes(t)) tags.push(t);
    }
    if (tags.length > MAX_TAGS) problems.tags += tags.length - MAX_TAGS;
    task.tags = tags.slice(0, MAX_TAGS);

    return { line, task };
  });

  const warnings = [];
  if (problems.status.length) {
    const distinct = [...new Set(problems.status)];
    warnings.push(`${plural(problems.status.length, 'row has', 'rows have')} a status that was not recognised (${quote(distinct)}); ${problems.status.length === 1 ? 'it was' : 'they were'} added as To do.`);
  }
  if (problems.priority.length) {
    const distinct = [...new Set(problems.priority)];
    warnings.push(`${plural(problems.priority.length, 'row has', 'rows have')} a priority that was not recognised (${quote(distinct)}); ${problems.priority.length === 1 ? 'it was' : 'they were'} set to Medium.`);
  }
  if (problems.date.length) {
    const first = problems.date[0];
    warnings.push(`${plural(problems.date.length, 'date was', 'dates were')} not recognised and left blank (first: row ${first.line}, “${first.raw}”). Dates are only read as YYYY-MM-DD, or with the month spelled out like Dec 1, 2026, because 03/04/2026 could be March or April.`);
  }
  if (problems.tags) warnings.push(`${plural(problems.tags, 'tag was', 'tags were')} dropped: a task keeps up to ${MAX_TAGS} tags of up to ${MAX_TAG} characters.`);
  if (problems.descriptions) warnings.push(`${plural(problems.descriptions, 'description was', 'descriptions were')} shortened to ${MAX_DESCRIPTION.toLocaleString('en-US')} characters.`);

  return {
    ok: true,
    mapping: FIELDS.filter((f) => column[f] !== undefined).map((field) => ({ field, header: headers[column[field]] })),
    ignoredHeaders: headers.filter((h, i) => h && !used.has(i)),
    items,
    tasks: items.filter((i) => i.task).map((i) => i.task),
    skipped: items.filter((i) => !i.task).map((i) => ({ line: i.line, reason: i.skip })),
    warnings,
  };
};
