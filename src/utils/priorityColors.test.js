import { describe, test, expect } from 'vitest';
import { getPriorityBadgeClasses, getPriorityDotClass, getPriorityBorderClass } from './priorityColors';

// First real frontend tests in this repo (see PLAN's testing-strategy
// section) — deliberately starting with pure, already-existing logic rather
// than inventing new coverage. This is also the exact source of truth
// CalendarView.jsx was fixed to use instead of its own divergent (and
// semantically inverted) priority-color map, so it's worth locking down.
describe('priorityColors', () => {
  test('High is spark (amber/energy), not brand or a stock Tailwind color', () => {
    expect(getPriorityDotClass('High')).toBe('bg-spark-500');
    expect(getPriorityBadgeClasses('High')).toContain('spark');
  });

  test('Medium is brand (violet)', () => {
    expect(getPriorityDotClass('Medium')).toBe('bg-brand-500');
    expect(getPriorityBadgeClasses('Medium')).toContain('brand');
  });

  test('Low is neutral, not brand or spark — deliberately doesn\'t compete visually', () => {
    const dot = getPriorityDotClass('Low');
    expect(dot).not.toContain('spark');
    expect(dot).not.toContain('brand');
  });

  test('an unrecognized priority falls back to Low rather than returning undefined', () => {
    expect(getPriorityDotClass('Unknown')).toBe(getPriorityDotClass('Low'));
    expect(getPriorityBadgeClasses(undefined)).toBe(getPriorityBadgeClasses('Low'));
    expect(getPriorityBorderClass(null)).toBe(getPriorityBorderClass('Low'));
  });
});
