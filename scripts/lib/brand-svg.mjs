// Pure SVG-string builders for the Motive brand assets. Everything is derived
// from src/config/brandMark.js — nothing here hard-codes geometry or colours —
// and everything returns a string, so the generator writes the files and the
// tests can compare the committed files against what these functions produce.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import { BRAND_COLORS as C, MARK, WORDMARK, glyphBounds, glyphRadius } from '../../src/config/brandMark.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const n = (v) => Number(v.toFixed(2));

const XMLNS = 'xmlns="http://www.w3.org/2000/svg"';

// ── Pieces ────────────────────────────────────────────────────────────────────
// Gradient in the tile's own coordinates (matches the in-app <Logo>).
export const tileGradient = (id = 'g') =>
  `<linearGradient id="${id}" x1="${MARK.gradient.x1}" y1="${MARK.gradient.y1}" x2="${MARK.gradient.x2}" y2="${MARK.gradient.y2}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${C.deep}"/><stop offset="1" stop-color="${C.base}"/></linearGradient>`;

// Gradient across a whole full-bleed canvas (maskable / adaptive / splash).
export const bleedGradient = (id = 'g') =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.deep}"/><stop offset="1" stop-color="${C.base}"/></linearGradient>`;

const strokeAttrs = (color) =>
  `fill="none" stroke="${color}" stroke-width="${MARK.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"`;

export const glyph = (color = '#fff') =>
  `<path d="${MARK.check}" ${strokeAttrs(color)}/><path d="${MARK.head}" ${strokeAttrs(color)}/>`;

const tileRect = (fill) =>
  `<rect x="${MARK.tile.x}" y="${MARK.tile.y}" width="${MARK.tile.size}" height="${MARK.tile.size}" rx="${MARK.tile.radius}" fill="${fill}"/>`;

// ── Whole marks ───────────────────────────────────────────────────────────────
// The standard mark: white glyph on the petrol tile, transparent outside the
// rounded corners. Favicon, PWA "any" icons, and the source for small PNGs.
export const tileSvg = ({ size = 48 } = {}) =>
  `<svg ${XMLNS} width="${size}" height="${size}" viewBox="0 0 ${MARK.viewBox} ${MARK.viewBox}" fill="none">
  <defs>${tileGradient()}</defs>
  ${tileRect('url(#g)')}
  ${glyph()}
</svg>
`;

// Glyph fitted inside a circular safe zone of a square canvas. `safeRadius` is
// the zone's radius as a fraction of the canvas (maskable icons: 0.40 = the 80%
// safe circle; Android adaptive icons: 0.33 = the 66% circle). The glyph is
// centred on its own bounding box, not on the tile, so it sits visually centred.
const fitTransform = (size, safeRadius) => {
  const b = glyphBounds();
  const k = (safeRadius * size) / glyphRadius();
  return `translate(${n(size / 2)} ${n(size / 2)}) scale(${n(k)}) translate(${n(-b.cx)} ${n(-b.cy)})`;
};

// `background: 'gradient'` → opaque full-bleed square (maskable icon, iOS
// apple-touch icon — iOS rounds the corners itself, so there must be no
// transparent ones). `'none'` → the glyph alone on transparency (adaptive-icon
// foreground layer). `margin` shrinks the zone slightly for breathing room.
export const bleedSvg = ({ size = 512, safeRadius = 0.4, background = 'gradient', margin = 0.92 } = {}) => {
  const bg = background === 'gradient' ? `<rect width="${size}" height="${size}" fill="url(#g)"/>` : '';
  const defs = background === 'gradient' ? `<defs>${bleedGradient()}</defs>` : '';
  return `<svg ${XMLNS} width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none">
  ${defs}
  ${bg}
  <g transform="${fitTransform(size, safeRadius * margin)}">${glyph()}</g>
</svg>
`;
};

// ── Wordmark (IBM Plex Sans Bold, outlined) ───────────────────────────────────
let cachedFont;
const loadFont = () => {
  if (cachedFont) return cachedFont;
  const file = path.join(root, `node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-${WORDMARK.weight}-normal.woff`);
  const buf = fs.readFileSync(file);
  cachedFont = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  return cachedFont;
};

// The wordmark as an outlined path, vertically centred on `cy`. Outlines mean it
// renders identically anywhere (email, README, OG image) without the font.
// Only ever used for the short word "Motive": outlined text through sharp/librsvg
// was seen to intermittently lose glyph edges in LONG strings (see
// wordmarkInkRatio below, which guards the real wordmark).
export const wordmark = ({ fontSize, x = 0, cy, fill }) => {
  const font = loadFont();
  const opts = { letterSpacing: WORDMARK.letterSpacingEm };
  const bb = font.getPath(WORDMARK.text, 0, 0, fontSize, opts).getBoundingBox();
  const baseline = cy - (bb.y1 + bb.y2) / 2;
  const d = font.getPath(WORDMARK.text, x, baseline, fontSize, opts).toPathData(2);
  return { svg: `<path d="${d}" fill="${fill}"/>`, width: font.getAdvanceWidth(WORDMARK.text, fontSize, opts) };
};

// ── Lockup: mark + wordmark ───────────────────────────────────────────────────
// `markSize` is the height of the mark in px. `tile: true` draws the petrol tile
// with the glyph inside it (for light or dark surfaces); `tile: false` draws the
// glyph alone, larger, for use ON a petrol background (email header, splash),
// where a petrol tile would vanish. `ink` colours the wordmark (and the glyph
// when there is no tile).
export const lockup = ({ markSize = 48, tile = true, ink = C.ink, pad = 0 } = {}) => {
  const fontSize = WORDMARK.sizeRatio * markSize;
  const gap = WORDMARK.gapRatio * markSize;
  const H = markSize + pad * 2;
  const cy = H / 2;

  let markSvg;
  let markWidth;
  if (tile) {
    const s = markSize / MARK.viewBox;
    markSvg = `<g transform="translate(${n(pad)} ${n(pad)}) scale(${n(s)})"><defs>${tileGradient('lg')}</defs>${tileRect('url(#lg)')}${glyph()}</g>`;
    markWidth = markSize;
  } else {
    const b = glyphBounds();
    const s = (markSize * 0.8) / b.height;
    markSvg = `<g transform="translate(${n(pad - b.minX * s)} ${n(cy - b.cy * s)}) scale(${n(s)})">${glyph(ink)}</g>`;
    markWidth = b.width * s;
  }

  const word = wordmark({ fontSize, x: pad + markWidth + gap, cy, fill: ink });
  const W = Math.ceil(pad * 2 + markWidth + gap + word.width);
  return {
    width: W,
    height: H,
    svg: `<svg ${XMLNS} width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none">
  ${markSvg}
  ${word.svg}
</svg>
`,
    // the same content without the <svg> wrapper, for composing into larger canvases
    inner: `${markSvg}${word.svg}`,
  };
};

// ── Animated README banner ────────────────────────────────────────────────────
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// The check draws itself, then the arrowhead, holds, and loops. The stroke
// attributes are fully drawn by default and SMIL only animates them, so a
// viewer that doesn't support SMIL still shows the complete mark.
export const animatedSvg = ({ size = 128 } = {}) => {
  // Vertices in drawing order: the check is p0→p1→p2, the head is p3→p2→p4.
  const [p0, p1, p2, p3, p4] = MARK.points;
  const checkLen = n(dist(p0, p1) + dist(p1, p2));
  const headLen = n(dist(p3, p2) + dist(p2, p4));
  const draw = (len, keyTimes, values) =>
    `<animate attributeName="stroke-dashoffset" values="${values.map((v) => (v ? len : 0)).join(';')}" keyTimes="${keyTimes}" dur="4s" repeatCount="indefinite"/>`;
  return `<svg ${XMLNS} width="${size}" height="${size}" viewBox="0 0 ${MARK.viewBox} ${MARK.viewBox}" fill="none" role="img" aria-label="Motive">
  <title>Motive</title>
  <defs>${tileGradient()}</defs>
  ${tileRect('url(#g)')}
  <path d="${MARK.check}" ${strokeAttrs('#fff')} stroke-dasharray="${checkLen}" stroke-dashoffset="0">${draw(checkLen, '0;0.12;0.9;1', [1, 0, 0, 1])}</path>
  <path d="${MARK.head}" ${strokeAttrs('#fff')} stroke-dasharray="${headLen}" stroke-dashoffset="0">${draw(headLen, '0;0.12;0.2;0.9;1', [1, 1, 0, 0, 1])}</path>
</svg>
`;
};

// ── Guard: the outlined wordmark must render completely ───────────────────────
// sharp/librsvg was seen to drop the right-hand part of some glyphs in outlined
// text, silently. A real failure would change the ink amount non-uniformly, so
// render the wordmark at 1× and at 2× and check the ink scales by ~4 (2² area).
// Returns the measured ratio; callers assert it is within tolerance of 4.
export const wordmarkInkRatio = async (sharp) => {
  const ink = async (scale) => {
    const fontSize = 100;
    const w = wordmark({ fontSize, x: 4, cy: 70, fill: '#000' });
    const W = Math.ceil(w.width) + 8;
    const svg = `<svg ${XMLNS} width="${W * scale}" height="${140 * scale}" viewBox="0 0 ${W} 140">${w.svg}</svg>`;
    const { data, info } = await sharp(Buffer.from(svg)).raw().toBuffer({ resolveWithObject: true });
    let sum = 0;
    for (let i = 3; i < data.length; i += info.channels) sum += data[i];
    return sum / 255;
  };
  return (await ink(2)) / (await ink(1));
};
