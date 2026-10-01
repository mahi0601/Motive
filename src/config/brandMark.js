// Single source of truth for the Motive mark. Plain ESM with no JSX/React so the
// same numbers feed BOTH the in-app <Logo> component (src/components/ui/Logo.jsx)
// and the asset generator (scripts/generate-brand-assets.mjs) — the favicon, PWA
// and Android icons, social image, README banner and email logo are all
// produced from this file, so they cannot drift apart again.
//
// The mark: a check whose long arm rises into an arrow — "done, and moving" —
// white on a petrol tile. Petrol is the brand hue and is deliberately kept off
// the status colours (see utils/statusColors.js: hue means *state*, never
// brand); there is no second accent, because amber already means "at risk" in
// the app. The glyph is one continuous idea drawn as two strokes so the
// arrowhead stays open and legible at 16px; stroke width is ≥ 4/48 for the same
// reason. Changing anything here means re-running `npm run brand`.
//
// Alternatives that were rendered and rejected (2026-09): the same check with a
// solid triangular arrowhead (the tilted head read as a pennant flag), and a
// rising zig-zag "trend line" (legible, but essentially the stock-chart
// "trending up" icon — not ownable, and it leans towards finance).

// Matches tailwind.config.js `brand` (700 = deep anchor, 500 = primary) and the
// dark surface / text tokens. Kept as literals because the generator runs in
// plain Node and cannot read the Tailwind config.
export const BRAND_COLORS = {
  deep: '#0E4C5C',
  base: '#1B7A8C',
  ink: '#0F1A20',
  inkOnDark: '#E6EDF0',
  surfaceDark: '#0B1418',
  abyss: '#061F26',
  deepest: '#0B323C',
};

export const MARK = {
  // Everything below is in a 48×48 coordinate space.
  viewBox: 48,
  tile: { x: 2, y: 2, size: 44, radius: 13 },
  gradient: { x1: 6, y1: 4, x2: 42, y2: 44 },
  strokeWidth: 4.4,
  // The check (short dip, then the long rising arm) …
  check: 'M11 27.5 L19.5 35.5 L36 14.5',
  // … and the open arrowhead at the end of that arm.
  head: 'M27.5 14.5 H36 V23',
  // Centre-line vertices of both strokes — used to size/centre the glyph inside
  // safe zones (maskable icons, Android adaptive icons) without hand-tuning.
  points: [
    [11, 27.5],
    [19.5, 35.5],
    [36, 14.5],
    [27.5, 14.5],
    [36, 23],
  ],
};

// Bounding box of the stroked glyph (centre-line extents grown by half a stroke).
export const glyphBounds = () => {
  const half = MARK.strokeWidth / 2;
  const xs = MARK.points.map((p) => p[0]);
  const ys = MARK.points.map((p) => p[1]);
  const minX = Math.min(...xs) - half;
  const maxX = Math.max(...xs) + half;
  const minY = Math.min(...ys) - half;
  const maxY = Math.max(...ys) + half;
  return { minX, maxX, minY, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, width: maxX - minX, height: maxY - minY };
};

// Farthest any part of the stroked glyph is from its own bounding-box centre —
// the radius of the smallest circle that contains it. A "safe zone" is a circle
// (maskable icons: 80% of the canvas), so this is the number to fit against.
// Android adaptive icons need the glyph inside 66% of their 108dp layer;
// @capacitor/assets achieves that by insetting the foreground image, so the
// source image is fitted to the same 80% circle.
export const glyphRadius = () => {
  const { cx, cy } = glyphBounds();
  const half = MARK.strokeWidth / 2;
  return Math.max(...MARK.points.map(([x, y]) => Math.hypot(x - cx, y - cy))) + half;
};

// The wordmark is IBM Plex Sans Bold — already the app's display face (font-display),
// so there is no new font download. These values are the "tuned" part of the
// lockup: weight, tracking, size relative to the mark, and the gap between them.
// Used by <Logo> (live text) and by the generator (outlined paths).
export const WORDMARK = {
  text: 'Motive',
  weight: 700,
  letterSpacingEm: -0.015,
  sizeRatio: 0.62, // font-size as a fraction of the mark's size
  gapRatio: 0.25, // gap between mark and wordmark as a fraction of the mark's size
};
