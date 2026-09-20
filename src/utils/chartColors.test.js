import { describe, test, expect } from 'vitest';
import { BRAND, CHART_PRIMARY, CHART_SERIES, chartAxisColor, chartGridColor, chartTooltipStyle } from './chartColors';

describe('chartColors', () => {
  test('CHART_PRIMARY is the brand-500 hex, matching tailwind.config.js\'s brand (petrol) scale', () => {
    expect(CHART_PRIMARY).toBe(BRAND[500]);
    expect(CHART_PRIMARY).toBe('#1B7A8C');
  });

  test('CHART_SERIES is a monochrome brand ramp with no duplicate stops', () => {
    expect(CHART_SERIES).toContain(BRAND[500]);
    expect(new Set(CHART_SERIES).size).toBe(CHART_SERIES.length);
  });

  // recharts reads these as presentation attributes (stroke/fill), never
  // Tailwind classes — a `dark:` utility silently does nothing here, which
  // is exactly why these exist as a isDark-driven function instead.
  test('axis/grid colors flip between the light and dark token values', () => {
    expect(chartAxisColor(false)).not.toBe(chartAxisColor(true));
    expect(chartGridColor(false)).not.toBe(chartGridColor(true));
  });

  test('tooltip style provides a background, border, and text color for both themes', () => {
    for (const isDark of [true, false]) {
      const style = chartTooltipStyle(isDark);
      expect(style.backgroundColor).toBeTruthy();
      expect(style.border).toContain('1px solid');
      expect(style.color).toBeTruthy();
    }
  });
});
