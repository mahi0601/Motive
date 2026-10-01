// @vitest-environment node
//
// The brand assets are GENERATED (npm run brand) from src/config/brandMark.js.
// These tests fail if someone edits the geometry without regenerating, if a
// generated file goes missing or has the wrong dimensions, or if a file the app
// references no longer exists — the ways the old hand-made assets drifted apart.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, test, expect } from 'vitest';
import sharp from 'sharp';
import tailwind from '../../tailwind.config.js';
import { BRAND_COLORS, MARK, WORDMARK, glyphBounds, glyphRadius } from './brandMark.js';
import { tileSvg, bleedSvg, animatedSvg, lockup, wordmarkInkRatio } from '../../scripts/lib/brand-svg.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(root, rel));

describe('committed SVGs match the generator (no drift from brandMark.js)', () => {
  test.each([
    ['public/motive.svg', () => tileSvg()],
    ['public/icon-maskable.svg', () => bleedSvg({ size: 512 })],
    ['assets/logo-animated.svg', () => animatedSvg({ size: 128 })],
  ])('%s', (file, build) => {
    expect(read(file)).toBe(build());
  });

  test('the backend README banner is an identical copy', () => {
    const backend = path.resolve(root, '../motive-backend/assets/logo-animated.svg');
    if (!fs.existsSync(backend)) return; // sibling repo not checked out
    expect(fs.readFileSync(backend, 'utf8')).toBe(read('assets/logo-animated.svg'));
  });
});

describe('generated PNGs', () => {
  const dims = [
    ['public/favicon-32.png', 32, 32],
    ['public/icons/icon-192.png', 192, 192],
    ['public/icons/icon-512.png', 512, 512],
    ['public/icons/icon-maskable-512.png', 512, 512],
    ['public/icons/apple-touch-icon.png', 180, 180],
    ['public/icons/og-image.png', 1200, 630],
    ['assets/icon-only.png', 1024, 1024],
    ['assets/icon-foreground.png', 1024, 1024],
    ['assets/icon-background.png', 1024, 1024],
    ['assets/splash.png', 2732, 2732],
    ['assets/splash-dark.png', 2732, 2732],
  ];

  test.each(dims)('%s is %ix%i', async (file, w, h) => {
    const meta = await sharp(path.join(root, file)).metadata();
    expect([meta.width, meta.height]).toEqual([w, h]);
  });

  test('the iOS touch icon is opaque — iOS rounds corners itself, transparent ones render black', async () => {
    const meta = await sharp(path.join(root, 'public/icons/apple-touch-icon.png')).metadata();
    expect(meta.hasAlpha).toBe(false);
  });

  test('the adaptive-icon foreground is transparent so the background layer shows through', async () => {
    const { data, info } = await sharp(path.join(root, 'assets/icon-foreground.png')).raw().toBuffer({ resolveWithObject: true });
    const cornerAlpha = data[3]; // top-left pixel
    expect(info.channels).toBe(4);
    expect(cornerAlpha).toBe(0);
  });

  test('the email logo is 2× (even dimensions) so it can be shown at half size for retina', async () => {
    const meta = await sharp(path.join(root, 'public/brand/logo-email.png')).metadata();
    expect(meta.height).toBe(80);
    expect(meta.width % 2).toBe(0);
  });
});

describe('files the app references exist', () => {
  test('index.html: icons, touch icon and social images are all in public/', () => {
    const html = read('index.html');
    const refs = [...html.matchAll(/(?:href|content)="(\/[^"]+\.(?:png|svg))"/g)].map((m) => m[1]);
    expect(refs.length).toBeGreaterThanOrEqual(5);
    for (const ref of refs) expect(exists(`public${ref}`), `public${ref}`).toBe(true);
  });

  test('the PWA manifest icons in vite.config.js are all in public/', () => {
    const config = read('vite.config.js');
    const icons = [...config.matchAll(/src:\s*'(\/[^']+\.(?:png|svg))'/g)].map((m) => m[1]);
    expect(icons.length).toBeGreaterThanOrEqual(3);
    for (const icon of icons) expect(exists(`public${icon}`), `public${icon}`).toBe(true);
  });

  test('the social image is the large 1200×630 card, not the tiny app icon', () => {
    const html = read('index.html');
    expect(html).toContain('content="/icons/og-image.png"');
    expect(html).toContain('content="summary_large_image"');
    expect(html).not.toMatch(/(?:og|twitter):image"\s+content="\/icons\/icon-512\.png"/);
  });
});

describe('design invariants', () => {
  test('brand colours match the Tailwind petrol ramp the rest of the app uses', () => {
    const brand = tailwind.theme.extend.colors.brand;
    expect(BRAND_COLORS.base.toLowerCase()).toBe(brand[500].toLowerCase());
    expect(BRAND_COLORS.deep.toLowerCase()).toBe(brand[700].toLowerCase());
    expect(BRAND_COLORS.deepest.toLowerCase()).toBe(brand[900].toLowerCase());
    expect(BRAND_COLORS.abyss.toLowerCase()).toBe(brand[950].toLowerCase());
  });

  test('stroke is heavy enough to survive 16px (≥ 4/48)', () => {
    expect(MARK.strokeWidth).toBeGreaterThanOrEqual(4);
  });

  test('the glyph has breathing room inside the tile (never crowds the rounded corners)', () => {
    const b = glyphBounds();
    const { x, y, size } = MARK.tile;
    for (const gap of [b.minX - x, x + size - b.maxX, b.minY - y, y + size - b.maxY]) {
      expect(gap).toBeGreaterThanOrEqual(5);
    }
  });

  test('the glyph fits inside the 80% maskable safe circle at the scale bleedSvg uses', () => {
    // bleedSvg scales the glyph so its radius = safeRadius × margin × canvas; the
    // same scale feeds the adaptive-icon foreground (the tool insets that layer).
    const canvas = 1000;
    const safeRadius = 0.4;
    const margin = 0.92;
    const scale = (safeRadius * margin * canvas) / glyphRadius();
    expect(glyphRadius() * scale).toBeLessThanOrEqual(safeRadius * canvas);
  });

  test('the adaptive-icon foreground glyph ends up inside Android\'s 66% safe zone after the 16.7% inset', async () => {
    // Measure it: find the glyph's farthest pixel from the canvas centre in the
    // generated 1024px foreground, apply the tool's inset, compare to 66% of the layer.
    const { data, info } = await sharp(path.join(root, 'assets/icon-foreground.png')).raw().toBuffer({ resolveWithObject: true });
    const c = info.width / 2;
    let far = 0;
    for (let y = 0; y < info.height; y += 2) {
      for (let x = 0; x < info.width; x += 2) {
        if (data[(y * info.width + x) * info.channels + 3] > 40) far = Math.max(far, Math.hypot(x - c, y - c));
      }
    }
    const afterInset = (far / info.width) * (1 - 2 * 0.167); // fraction of the 108dp layer
    expect(afterInset).toBeLessThanOrEqual(0.33); // 66% diameter → 0.33 radius
    expect(afterInset).toBeGreaterThan(0.2); // and not shrunk to nothing
  });

  test('every generated mark uses only the shared geometry', () => {
    for (const svg of [tileSvg(), bleedSvg(), animatedSvg(), lockup({ tile: true }).svg, lockup({ tile: false }).svg]) {
      expect(svg).toContain(MARK.check);
      expect(svg).toContain(MARK.head);
    }
  });
});

describe('outlined wordmark', () => {
  test('renders completely — ink scales by ~4 from 1× to 2× (guards a silent glyph-clipping bug seen in sharp/librsvg)', async () => {
    const ratio = await wordmarkInkRatio(sharp);
    expect(ratio).toBeGreaterThan(3.88);
    expect(ratio).toBeLessThan(4.12);
  });

  test('the lockup contains an outlined "Motive" (paths, no <text> that would need a font)', () => {
    const { svg } = lockup({ tile: true, ink: '#fff' });
    expect(svg).not.toContain('<text');
    expect(svg).toMatch(/<path d="M[^"]+" fill="#fff"\/>/);
    expect(WORDMARK.text).toBe('Motive');
  });
});
