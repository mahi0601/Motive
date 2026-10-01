import { describe, test, expect } from 'vitest';
import { STATUS_ACCENTS, ACCENT_KEYS, accentFor } from './statusAccents';

// WCAG relative luminance / contrast ratio.
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// The accent is used as TEXT (milestone label, headline accents) on the page's
// surfaces, so each preset has to clear 4.5:1 in both themes. Surfaces are the
// real ones from tailwind.config.js.
const LIGHT_SURFACES = ['#FFFFFF', '#F6F8F9'];
const DARK_SURFACES = ['#17272F', '#0B1418'];

describe('status page accents', () => {
  test('are exactly the six the server accepts, in the same order', () => {
    expect(ACCENT_KEYS).toEqual(['teal', 'blue', 'violet', 'rose', 'amber', 'slate']);
  });

  test.each(ACCENT_KEYS)('%s is readable as text on light and dark surfaces (>= 4.5:1)', (key) => {
    const { light, dark } = STATUS_ACCENTS[key];
    for (const bg of LIGHT_SURFACES) expect(contrast(light, bg)).toBeGreaterThanOrEqual(4.5);
    for (const bg of DARK_SURFACES) expect(contrast(dark, bg)).toBeGreaterThanOrEqual(4.5);
  });

  test('every preset has a human label', () => {
    for (const key of ACCENT_KEYS) expect(STATUS_ACCENTS[key].label).toMatch(/\w/);
  });

  test('an unknown or missing key falls back to teal rather than breaking the page', () => {
    expect(accentFor('hotpink')).toBe(STATUS_ACCENTS.teal);
    expect(accentFor(undefined)).toBe(STATUS_ACCENTS.teal);
    expect(accentFor('violet')).toBe(STATUS_ACCENTS.violet);
  });
});
