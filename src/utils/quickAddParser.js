import * as chrono from 'chrono-node';

// Local, dependency-free-of-any-API date/priority extraction for the
// quick-add title field — e.g. "submit report tomorrow 3pm high priority"
// becomes { title: "submit report", dueDate: "2026-09-09", priority: "High" }.
// Deliberately not an LLM call: this is mechanical extraction where a local
// parser is more reliable (and free) than round-tripping to an API.
const PRIORITY_PATTERNS = [
  { regex: /\s*\b(high priority|priority high|!high)\b\s*/i, priority: 'High' },
  { regex: /\s*\b(medium priority|priority medium|!med(?:ium)?)\b\s*/i, priority: 'Medium' },
  { regex: /\s*\b(low priority|priority low|!low)\b\s*/i, priority: 'Low' },
];

// "YYYY-MM-DD" from LOCAL date components — matches what `<input type="date">`
// produces, so it flows through the same dueDate handling as manual entry
// (chrono resolves relative phrases like "tomorrow" in local time; converting
// via `toISOString()` instead would risk shifting the date across a UTC
// day boundary depending on the viewer's timezone).
function toDateInputValue(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseQuickAdd(rawText) {
  let title = rawText;
  let priority = null;
  let dueDate = null;

  for (const { regex, priority: p } of PRIORITY_PATTERNS) {
    if (regex.test(title)) {
      priority = p;
      title = title.replace(regex, ' ');
      break;
    }
  }

  const results = chrono.parse(title);
  if (results.length > 0) {
    const result = results[0];
    dueDate = toDateInputValue(result.start.date());
    title = title.slice(0, result.index) + title.slice(result.index + result.text.length);
  }

  title = title.replace(/\s{2,}/g, ' ').trim();

  return { title: title || rawText.trim(), priority, dueDate };
}
