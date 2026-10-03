// Pure helpers for a status page's milestones: the owner's editor rows and what a
// client sees. A page carries up to MAX_MILESTONES, in order; the first is the
// "next" one. Titles and dates are public plain text.
export const MAX_MILESTONES = 12;
export const MILESTONE_TITLE_MAX = 100;

let nextKey = 1;
const blankRow = () => ({ key: nextKey++, id: undefined, title: '', date: '' });
const dateOnly = (d) => (d ? String(d).slice(0, 10) : '');

// The editor starts from what is saved. A server that predates the list sends only
// `milestoneTitle`/`milestoneDate`, which become one row (with no id, so saving it
// is a plain replace). With nothing saved there is one empty row to type into.
export const milestoneRowsFrom = (workspace) => {
  const list = workspace?.milestones;
  if (Array.isArray(list) && list.length) {
    return list.map((m) => ({ key: nextKey++, id: m.id, title: m.title || '', date: dateOnly(m.date) }));
  }
  if (!Array.isArray(list) && workspace?.milestoneTitle) {
    return [{ key: nextKey++, id: undefined, title: workspace.milestoneTitle, date: dateOnly(workspace.milestoneDate) }];
  }
  return [blankRow()];
};

export const newMilestoneRow = blankRow;

const isBlank = (r) => !r.title.trim() && !r.date;

// The rows that count: completely empty ones (the spare row) are not saved.
export const keptRows = (rows) => rows.filter((r) => !isBlank(r));

// What is sent: rows in order, ids kept (an id means "this one, keep its sign-off"),
// a blank date as null.
export const toPayload = (rows) =>
  keptRows(rows).map((r) => ({ ...(r.id ? { id: r.id } : {}), title: r.title.trim(), date: r.date || null }));

// A date with no name is almost certainly a mistake; say which row.
export const validateRows = (rows) => {
  const kept = keptRows(rows);
  if (kept.length > MAX_MILESTONES) return `A status page can have up to ${MAX_MILESTONES} milestones.`;
  const bad = kept.findIndex((r) => !r.title.trim());
  if (bad !== -1) return `Give milestone ${bad + 1} a name, or clear its date.`;
  return '';
};

// Is there anything to save? Compares what would be sent, so keys and the spare
// blank row do not count.
export const sameRows = (a, b) => JSON.stringify(toPayload(a)) === JSON.stringify(toPayload(b));

// The list a client sees. An older server sends only `milestone`.
export const publicMilestones = (page) => {
  if (!page) return [];
  if (Array.isArray(page.milestones)) return page.milestones;
  return page.milestone ? [page.milestone] : [];
};

// Which milestone a client most likely means: the first not yet approved.
export const defaultMilestoneId = (milestones) => (milestones.find((m) => !m.approvedAt) || milestones[0])?.id;
