// "2 hours ago", "yesterday", "on Sep 27": a short, human way to say when something happened.
// Beyond a week it gives the date (with the year only when it is not this year), because
// "34 days ago" is harder to place than a date. A time slightly in the future (clock drift
// between the server and this device) reads as "just now", never a negative.
const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const plural = (n, unit) => `${n} ${unit}${n === 1 ? '' : 's'} ago`;

export const timeAgo = (iso, now = new Date()) => {
  if (!iso) return '';
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '';
  const elapsed = Math.max(0, now.getTime() - then.getTime());
  if (elapsed < MIN) return 'just now';
  if (elapsed < HOUR) return plural(Math.floor(elapsed / MIN), 'minute');
  if (elapsed < DAY) return plural(Math.floor(elapsed / HOUR), 'hour');
  if (elapsed < 2 * DAY) return 'yesterday';
  if (elapsed < 7 * DAY) return plural(Math.floor(elapsed / DAY), 'day');
  const sameYear = then.getFullYear() === now.getFullYear();
  return `on ${MONTHS[then.getMonth()]} ${then.getDate()}${sameYear ? '' : `, ${then.getFullYear()}`}`;
};
