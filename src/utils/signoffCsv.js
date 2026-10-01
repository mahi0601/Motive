// The sign-off record as a CSV an agency can keep or send. Every cell can
// contain text a client typed, so:
//  - fields with commas, quotes or line breaks are quoted;
//  - a cell that starts with = + - @ (or a tab/CR) gets a leading apostrophe,
//    so opening the file in a spreadsheet cannot run it as a formula.
// The header says outright that names are typed by the sender and unverified.
const HEADER = ['Milestone', 'Approved by (typed by the sender; not verified)', 'Approved on (UTC)', 'Message'];

const cell = (value) => {
  let text = value == null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const when = (iso) => new Date(iso).toISOString().slice(0, 16).replace('T', ' ');

export const buildSignoffCsv = (items) =>
  [HEADER.map(cell).join(',')]
    .concat(items.map((i) => [i.milestoneTitle || '(no milestone)', i.authorName, when(i.createdAt), i.message].map(cell).join(',')))
    .join('\r\n');

// Hands the CSV to the browser as a download (the same blob approach as the
// data export, since the data needs the Authorization header to fetch).
export const downloadSignoffCsv = (items) => {
  const blob = new Blob([buildSignoffCsv(items)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `motive-sign-offs-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
