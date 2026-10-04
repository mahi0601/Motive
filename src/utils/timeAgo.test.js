import { describe, test, expect } from 'vitest';
import { timeAgo } from './timeAgo';

const NOW = new Date('2026-10-07T12:00:00Z');
const ago = (ms) => new Date(NOW.getTime() - ms).toISOString();
const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe('timeAgo', () => {
  test.each([
    [0, 'just now'],
    [20 * 1000, 'just now'],
    [59 * 1000, 'just now'],
    [1 * MIN, '1 minute ago'],
    [5 * MIN, '5 minutes ago'],
    [59 * MIN, '59 minutes ago'],
    [1 * HOUR, '1 hour ago'],
    [2 * HOUR + 30 * MIN, '2 hours ago'],
    [23 * HOUR, '23 hours ago'],
    [24 * HOUR, 'yesterday'],
    [47 * HOUR, 'yesterday'],
    [2 * DAY, '2 days ago'],
    [6 * DAY, '6 days ago'],
  ])('%d ms ago reads "%s"', (ms, expected) => {
    expect(timeAgo(ago(ms), NOW)).toBe(expected);
  });

  test('beyond a week it gives the date (as the viewer sees it), with the year only when it is not this year', () => {
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const local = (iso) => {
      const d = new Date(iso);
      return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
    };
    expect(timeAgo(ago(10 * DAY), NOW)).toBe(`on ${local(ago(10 * DAY))}`);
    expect(timeAgo(ago(10 * DAY), NOW)).toMatch(/^on Sep (26|27|28)$/); // the same instant is a different calendar day in different timezones
    expect(timeAgo('2025-12-30T12:00:00Z', NOW)).toBe(`on ${local('2025-12-30T12:00:00Z')}, ${new Date('2025-12-30T12:00:00Z').getFullYear()}`);
  });

  test('a time slightly in the future (clock drift) reads as just now, never a negative', () => {
    expect(timeAgo(new Date(NOW.getTime() + 30 * 1000).toISOString(), NOW)).toBe('just now');
  });

  test('nothing, or something that is not a date, gives an empty string', () => {
    expect(timeAgo(null, NOW)).toBe('');
    expect(timeAgo(undefined, NOW)).toBe('');
    expect(timeAgo('not a date', NOW)).toBe('');
  });
});
