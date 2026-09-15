import { describe, test, expect } from 'vitest';
import { BRAND, SPARK, CHART_PRIMARY, CHART_SERIES, chartAxisColor, chartGridColor, chartTooltipStyle } from './chartColors';

describe('chartColors', () => {
  test('CHART_PRIMARY is the brand-500 hex, matching tailwind.config.js\'s brand scale', () => {
    expect(CHART_PRIMARY).toBe(BRAND[500]);
    expect(CHART_PRIMARY).toBe('#7C5CF6');
  });

  test('CHART_SERIES puts spark exactly once, as the "stands out" accent', () => {
    expect(CHART_SERIES).toContain(SPARK[500]);
    expect(CHART_SERIES.filter((c) => c === SPARK[500])).toHaveLength(1);
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
