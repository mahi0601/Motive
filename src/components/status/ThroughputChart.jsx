import React, { useState } from 'react';

// "Shipped each week": how many tasks were finished in each of the last weeks, so a client
// sees momentum and not only a total. A single-series column chart in the page's accent.
//
// Marks: thin columns (24px at most), one flat baseline, a 4px rounded top and a square
// bottom, no stroke around them, plenty of air between neighbours. Only the latest week and
// the highest week carry a number, and every second week is named on the axis; the readout
// and the table carry the rest. Hovering a column dims the others. Text
// wears text colours, never the accent. The drawing is hidden from screen readers because
// the sentence above it and the table below it say the same thing.
const W = 360;
const H = 150;
const PAD = { left: 24, right: 6, top: 16, bottom: 24 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;
const MAX_BAR = 20; // drawn at up to ~1.2x (see the width cap below), so this stays at or under 24px on screen
const RADIUS = 4;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// 'YYYY-MM-DD' (a Monday) to "Oct 5", read as a calendar date so the label never shifts with the
// viewer's timezone.
const weekLabel = (start) => {
  const [, m, d] = start.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}`;
};

// A clean number at or above the highest count, so the axis top is readable.
const niceTop = (max) => {
  const step = max <= 5 ? 1 : max <= 20 ? 5 : max <= 100 ? 10 : 50;
  return Math.max(1, Math.ceil(max / step) * step);
};

const num = (n) => String(Math.round(n * 100) / 100);
const plural = (n) => `${n} ${n === 1 ? 'task' : 'tasks'}`;

// A column with a rounded top and a square bottom, never rounded past its own height.
const columnPath = (x, y, w, h) => {
  const r = Math.min(RADIUS, h, w / 2);
  const bottom = y + h;
  return `M${num(x)},${num(bottom)}V${num(y + r)}a${num(r)},${num(r)} 0 0 1 ${num(r)},${num(-r)}H${num(x + w - r)}a${num(r)},${num(r)} 0 0 1 ${num(r)},${num(r)}V${num(bottom)}Z`;
};

const ThroughputChart = ({ throughput }) => {
  const items = throughput?.items;
  const [active, setActive] = useState(null);
  if (!Array.isArray(items) || items.length < 2) return null;
  const total = items.reduce((n, w) => n + w.count, 0);
  if (total === 0) return null;

  const max = Math.max(...items.map((w) => w.count));
  const top = niceTop(max);
  const slot = PLOT_W / items.length;
  const barW = Math.min(MAX_BAR, slot - 14);
  const baseline = PAD.top + PLOT_H;
  const latest = items.length - 1;
  const highest = items.findIndex((w) => w.count === max);
  const labelled = new Set([latest, highest].filter((i) => items[i].count > 0));

  const describe = (i) => `Week of ${weekLabel(items[i].start)}: ${plural(items[i].count)} shipped${i === latest ? ' (so far)' : ''}`;
  const readout = active === null ? `${plural(total)} shipped in the last ${items.length} weeks` : describe(active);

  const gridline = 'stroke-light-border dark:stroke-dark-border';
  const muted = 'fill-light-muted dark:fill-dark-muted';

  return (
    <section
      aria-label="Shipped each week"
      className="mt-4 rounded-xl border border-light-border bg-light-surface px-4 py-3 dark:border-dark-border dark:bg-dark-raised"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--accent-l)] dark:text-[color:var(--accent-d)]">
        Shipped each week
      </p>
      <p role="status" className="mt-0.5 text-sm font-medium text-light-text dark:text-dark-text">
        {readout}
      </p>

      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto mt-2 h-auto w-full max-w-md" aria-hidden="true" focusable="false">
        <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top} y2={PAD.top} strokeWidth="1" className={gridline} />
        <line x1={PAD.left} x2={W - PAD.right} y1={baseline} y2={baseline} strokeWidth="1" className={gridline} />
        <text data-y-tick x={PAD.left - 6} y={baseline + 3} textAnchor="end" fontSize="11" className={muted}>0</text>
        <text data-y-tick x={PAD.left - 6} y={PAD.top + 3} textAnchor="end" fontSize="11" className={muted}>{top}</text>

        {items.map((w, i) => {
          const cx = PAD.left + slot * i + slot / 2;
          const h = (w.count / top) * PLOT_H;
          const y = baseline - h;
          return (
            <g key={w.start}>
              {w.count > 0 && (
                <path
                  data-mark
                  data-week={w.start}
                  data-width={num(barW)}
                  data-y={num(y)}
                  data-height={num(h)}
                  d={columnPath(cx - barW / 2, y, barW, h)}
                  className={`fill-[color:var(--accent-l)] dark:fill-[color:var(--accent-d)] transition-opacity ${active !== null && active !== i ? 'opacity-40' : ''}`}
                />
              )}
              {labelled.has(i) && (
                <text data-value-label={w.start} x={cx} y={y - 4} textAnchor="middle" fontSize="12" fontWeight="600" className="fill-light-text dark:fill-dark-text">
                  {w.count}
                </text>
              )}
              {(latest - i) % 2 === 0 && (
                <text data-week-label x={cx} y={H - 7} textAnchor="middle" fontSize="11" className={muted}>{weekLabel(w.start)}</text>
              )}
              {/* A hit area wider than the column, so a thin column is easy to hit; a tap works like a hover. */}
              <rect
                data-hit={w.start}
                data-width={num(slot)}
                x={PAD.left + slot * i}
                y={PAD.top}
                width={slot}
                height={PLOT_H + PAD.bottom}
                fill="transparent"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onClick={() => setActive(i)}
              />
            </g>
          );
        })}
      </svg>

      <details className="mt-1">
        <summary className="cursor-pointer text-xs text-light-muted dark:text-dark-muted">Show as a table</summary>
        <table aria-label="Tasks shipped each week" className="mt-2 w-full text-left text-xs text-light-text dark:text-dark-text">
          <thead>
            <tr className="border-b border-light-border text-light-muted dark:border-dark-border dark:text-dark-muted">
              <th scope="col" className="py-1 pr-3 font-medium">Week of</th>
              <th scope="col" className="py-1 font-medium">Tasks shipped</th>
            </tr>
          </thead>
          <tbody>
            {items.map((w, i) => (
              <tr key={w.start} className="border-b border-light-border/60 dark:border-dark-border/60">
                <th scope="row" className="py-1 pr-3 font-normal">{weekLabel(w.start)}{i === latest ? ' (so far)' : ''}</th>
                <td className="py-1">{w.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
};

export default ThroughputChart;
