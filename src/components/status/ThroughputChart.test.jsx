import React from 'react';
import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import ThroughputChart from './ThroughputChart';

// Eight weeks, oldest first, the last being this week so far.
const WEEKS = ['2026-08-17', '2026-08-24', '2026-08-31', '2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28', '2026-10-05'];
const make = (counts) => ({ weeks: 8, items: WEEKS.map((start, i) => ({ start, count: counts[i] })) });
const COUNTS = [1, 2, 0, 3, 2, 4, 3, 2];
const renderChart = (t = make(COUNTS)) => render(<ThroughputChart throughput={t} />);
const region = () => screen.getByRole('region', { name: /shipped each week/i });
const marks = () => region().querySelectorAll('[data-mark]');

describe('ThroughputChart', () => {
  test('says in words what it shows: the total over the weeks', () => {
    renderChart();
    expect(region()).toHaveTextContent('17 tasks shipped in the last 8 weeks');
  });

  test('a single task reads naturally', () => {
    renderChart(make([0, 0, 0, 0, 0, 0, 0, 1]));
    expect(region()).toHaveTextContent('1 task shipped in the last 8 weeks');
  });

  test('has one column for each week that shipped something, and none for a week with nothing', () => {
    renderChart();
    expect(marks()).toHaveLength(7);
    expect([...marks()].map((m) => m.getAttribute('data-week'))).not.toContain('2026-08-31');
  });

  describe('mark specs', () => {
    test('columns are thin (24px or less), all the same width, and sit on one baseline', () => {
      renderChart();
      const rects = [...marks()];
      const widths = new Set(rects.map((m) => m.getAttribute('data-width')));
      expect(widths.size).toBe(1);
      expect(Number([...widths][0])).toBeLessThanOrEqual(24);
      const bottoms = new Set(rects.map((m) => Number(m.getAttribute('data-y')) + Number(m.getAttribute('data-height'))));
      expect(bottoms.size).toBe(1);
    });

    test('heights are proportional to the count, starting from zero', () => {
      renderChart();
      const heightOf = (week) => Number(region().querySelector(`[data-week="${week}"]`).getAttribute('data-height'));
      expect(heightOf('2026-09-28')).toBeCloseTo((heightOf('2026-08-24') * 3) / 2, 0); // 3 vs 2
      expect(heightOf('2026-09-21')).toBeGreaterThan(heightOf('2026-09-28')); // the tallest
      expect(heightOf('2026-08-17') * 4).toBeCloseTo(heightOf('2026-09-21'), 0); // 1 vs 4
    });

    test('the top is rounded and the bottom is square', () => {
      renderChart();
      const d = marks()[0].getAttribute('d');
      expect(d).toMatch(/a\s*[\d.]+[ ,][\d.]+ 0 0 1/); // a rounded corner on top
      expect((d.match(/\ba\s/g) || d.match(/a[\d.]/g) || []).length).toBe(2); // two arcs only: the top corners
    });

    test('a short column does not round past its own height', () => {
      renderChart(make([0, 0, 0, 0, 0, 0, 0, 1]));
      const m = marks()[0];
      expect(Number(m.getAttribute('data-height'))).toBeGreaterThan(0);
      expect(m.getAttribute('d')).not.toMatch(/NaN|Infinity/);
    });

    test('marks use the page accent, light and dark, and no stroke is drawn around them', () => {
      renderChart();
      const cls = marks()[0].getAttribute('class');
      expect(cls).toContain('fill-[color:var(--accent-l)]');
      expect(cls).toContain('dark:fill-[color:var(--accent-d)]');
      expect(marks()[0].getAttribute('stroke')).toBeNull();
    });
  });

  describe('labels', () => {
    test('only the latest week and the highest week carry a value, never every column', () => {
      renderChart();
      const values = [...region().querySelectorAll('[data-value-label]')].map((t) => [t.getAttribute('data-value-label'), t.textContent]);
      expect(values).toEqual(expect.arrayContaining([['2026-09-21', '4'], ['2026-10-05', '2']]));
      expect(values).toHaveLength(2);
    });

    test('when the latest week is also the highest it is labelled once', () => {
      renderChart(make([1, 0, 0, 0, 0, 0, 0, 5]));
      expect(region().querySelectorAll('[data-value-label]')).toHaveLength(1);
    });

    test('text wears text colours, never the accent', () => {
      renderChart();
      const texts = region().querySelectorAll('svg text');
      expect(texts.length).toBeGreaterThan(0);
      for (const t of texts) {
        expect(t.getAttribute('class')).toMatch(/fill-light-(muted|text)/);
        expect(t.getAttribute('class')).not.toMatch(/accent/);
      }
    });

    test('the axis shows zero and the top value, and weeks are named by their Monday', () => {
      renderChart();
      const axis = [...region().querySelectorAll('[data-y-tick]')].map((t) => t.textContent);
      expect(axis).toEqual(['0', '4']);
      // Every second week is named, counting back from this week, so the labels never crowd;
      // the table has every week.
      const weeks = [...region().querySelectorAll('[data-week-label]')].map((t) => t.textContent);
      expect(weeks).toEqual(['Aug 24', 'Sep 7', 'Sep 21', 'Oct 5']);
    });

    test('the axis top is a clean number for bigger counts', () => {
      renderChart(make([0, 0, 0, 0, 0, 0, 0, 13]));
      expect([...region().querySelectorAll('[data-y-tick]')].map((t) => t.textContent)).toEqual(['0', '15']);
    });
  });

  describe('reading it', () => {
    test('hovering a week shows its number, and leaving goes back to the total; this week says so far', () => {
      renderChart();
      const slot = (w) => region().querySelector(`[data-hit="${w}"]`);
      fireEvent.mouseEnter(slot('2026-09-14'));
      expect(screen.getByRole('status')).toHaveTextContent('Week of Sep 14: 2 tasks shipped');
      fireEvent.mouseEnter(slot('2026-10-05'));
      expect(screen.getByRole('status')).toHaveTextContent('Week of Oct 5: 2 tasks shipped (so far)');
      fireEvent.mouseLeave(slot('2026-10-05'));
      expect(screen.getByRole('status')).toHaveTextContent('17 tasks shipped in the last 8 weeks');
    });

    test('a week with nothing can be hovered too, and says 0', () => {
      renderChart();
      fireEvent.mouseEnter(region().querySelector('[data-hit="2026-08-31"]'));
      expect(screen.getByRole('status')).toHaveTextContent('Week of Aug 31: 0 tasks shipped');
    });

    test('hovering a week dims the other columns, and leaving restores them', () => {
      renderChart();
      const mark = (w) => region().querySelector(`[data-mark][data-week="${w}"]`);
      expect(mark('2026-09-14').getAttribute('class')).not.toContain('opacity-40');
      fireEvent.mouseEnter(region().querySelector('[data-hit="2026-09-14"]'));
      expect(mark('2026-09-14').getAttribute('class')).not.toContain('opacity-40');
      expect(mark('2026-09-21').getAttribute('class')).toContain('opacity-40');
      fireEvent.mouseLeave(region().querySelector('[data-hit="2026-09-14"]'));
      expect(mark('2026-09-21').getAttribute('class')).not.toContain('opacity-40');
    });

    test('a tap works like a hover (touch)', () => {
      renderChart();
      fireEvent.click(region().querySelector('[data-hit="2026-09-07"]'));
      expect(screen.getByRole('status')).toHaveTextContent('Week of Sep 7: 3 tasks shipped');
    });

    test('hit areas are wider than the columns, so a thin column is easy to hit', () => {
      renderChart();
      const hit = Number(region().querySelector('[data-hit]').getAttribute('data-width'));
      expect(hit).toBeGreaterThan(Number(marks()[0].getAttribute('data-width')));
    });
  });

  describe('table view (the same numbers without the picture)', () => {
    test('is a native disclosure that lists every week with its count and flags this week', () => {
      renderChart();
      const details = region().querySelector('details');
      expect(within(details).getByText(/show as a table/i)).toBeInTheDocument();
      const table = within(details).getByRole('table', { name: /tasks shipped each week/i });
      const rows = within(table).getAllByRole('row');
      expect(rows).toHaveLength(1 + 8);
      expect(rows[1]).toHaveTextContent('Aug 17');
      expect(rows[1]).toHaveTextContent('1');
      expect(rows[8]).toHaveTextContent(/oct 5.*so far/i);
    });

    test('the drawing itself is hidden from screen readers, because the table and the sentence say it all', () => {
      renderChart();
      expect(region().querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('when there is nothing to show', () => {
    test.each([
      ['nothing shipped in any week', make([0, 0, 0, 0, 0, 0, 0, 0])],
      ['no data at all', undefined],
      ['an empty list', { weeks: 8, items: [] }],
      ['an older server shape', {}],
    ])('renders nothing for %s', (_l, t) => {
      const { container } = render(<ThroughputChart throughput={t} />);
      expect(container).toBeEmptyDOMElement();
    });
  });
});
