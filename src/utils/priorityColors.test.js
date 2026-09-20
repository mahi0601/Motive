import { describe, test, expect } from 'vitest';
import { getPriorityBadgeClasses, getPriorityDotClass, getPriorityBorderClass } from './priorityColors';

// First real frontend tests in this repo (see PLAN's testing-strategy
// section) — deliberately starting with pure, already-existing logic rather
// than inventing new coverage. This is also the exact source of truth
// CalendarView.jsx was fixed to use instead of its own divergent (and
// semantically inverted) priority-color map, so it's worth locking down.
//
// Priority is expressed by WEIGHT in the brand petrol ramp, not by a
// separate hue (see PLAN "Petrol & Ink") — hue is reserved exclusively for
// delivery STATE (statusColors.js), so a High-priority task never collides
// visually with an At-risk one.
describe('priorityColors', () => {
  test('High is the darkest brand weight, not a semantic status color', () => {
    expect(getPriorityDotClass('High')).toContain('brand-700');
    expect(getPriorityBadgeClasses('High')).not.toContain('semantic');
  });

  test('Medium is a lighter brand weight than High', () => {
    expect(getPriorityDotClass('Medium')).toBe('bg-brand-400');
    expect(getPriorityBadgeClasses('Medium')).toContain('brand');
  });

  test('Low is neutral, not brand or a semantic status color — deliberately doesn\'t compete visually', () => {
    const dot = getPriorityDotClass('Low');
    expect(dot).not.toContain('semantic');
    expect(dot).not.toContain('brand');
  });

  test('an unrecognized priority falls back to Low rather than returning undefined', () => {
    expect(getPriorityDotClass('Unknown')).toBe(getPriorityDotClass('Low'));
    expect(getPriorityBadgeClasses(undefined)).toBe(getPriorityBadgeClasses('Low'));
    expect(getPriorityBorderClass(null)).toBe(getPriorityBorderClass('Low'));
  });
});
