// Generates every static brand asset from ONE source: src/config/brandMark.js
// (geometry + colours) via scripts/lib/brand-svg.mjs (SVG builders).
//
//   npm run brand
//
// Writes (relative to this repo):
//   public/            favicon + PWA + iOS icons, social (OG) image, email logo
//   assets/            README banner, and the source images @capacitor/assets
//                      reads to generate the Android launcher icons and splash
//                      (run `npm run brand:android` afterwards for those)
// and copies the README banner into ../motive-backend/assets/ when that sibling
// repo is present.
//
// Re-running overwrites generated files. Edit the geometry in brandMark.js, not
// the outputs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { BRAND_COLORS as C } from '../src/config/brandMark.js';
import { tileSvg, bleedSvg, bleedGradient, lockup, animatedSvg, wordmarkInkRatio } from './lib/brand-svg.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = (...p) => path.join(root, ...p);
const written = [];

const ensureDir = (file) => fs.mkdirSync(path.dirname(file), { recursive: true });
const writeText = (rel, text) => {
  const file = out(rel);
  ensureDir(file);
  fs.writeFileSync(file, text);
  written.push(`${rel}  (${text.length} B)`);
};
const writePng = async (rel, svg, { opaque = false } = {}) => {
  const file = out(rel);
  ensureDir(file);
  let img = sharp(Buffer.from(svg));
  if (opaque) img = img.flatten({ background: C.deep }).removeAlpha();
  const info = await img.png({ compressionLevel: 9 }).toFile(file);
  written.push(`${rel}  (${info.width}×${info.height}, ${info.channels}ch, ${info.size} B)`);
};

// 0. Guard first — a wordmark that renders incompletely must never ship.
const ratio = await wordmarkInkRatio(sharp);
if (Math.abs(ratio - 4) > 0.12) {
  console.error(`Wordmark failed its render check: ink scaled by ${ratio.toFixed(3)} between 1× and 2× (expected ≈4). Aborting.`);
  process.exit(1);
}
console.log(`wordmark render check ok (ink ratio ${ratio.toFixed(3)} ≈ 4)`);

// 1. Web / PWA ──────────────────────────────────────────────────────────────
writeText('public/motive.svg', tileSvg());
writeText('public/icon-maskable.svg', bleedSvg({ size: 512 }));
await writePng('public/favicon-32.png', tileSvg({ size: 32 }));
await writePng('public/icons/icon-192.png', tileSvg({ size: 192 }));
await writePng('public/icons/icon-512.png', tileSvg({ size: 512 }));
await writePng('public/icons/icon-maskable-512.png', bleedSvg({ size: 512 }));
// iOS rounds the corners itself, so this is an opaque full-bleed square.
await writePng('public/icons/apple-touch-icon.png', bleedSvg({ size: 180 }), { opaque: true });

// 2. Social share image (1200×630): tile lockup, white wordmark, on a dark petrol field.
{
  const l = lockup({ markSize: 200, tile: true, ink: '#FFFFFF' });
  const W = 1200;
  const H = 630;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.deepest}"/><stop offset="1" stop-color="${C.abyss}"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <g transform="translate(${Math.round((W - l.width) / 2)} ${Math.round((H - l.height) / 2)})">${l.inner}</g>
</svg>`;
  await writePng('public/icons/og-image.png', svg);
}

// 3. Email header logo: reversed (white on transparent) — it sits on the petrol
// gradient strip, where a petrol tile would disappear. 2× size; displayed at half.
{
  const l = lockup({ markSize: 80, tile: false, ink: '#FFFFFF' });
  await writePng('public/brand/logo-email.png', l.svg);
  written.push(`   ↳ email logo is ${l.width}×${l.height}px — display it at ${l.width / 2}×${l.height / 2}`);
}

// 4. README banner (animated) — also copied into the backend repo.
const banner = animatedSvg({ size: 128 });
writeText('assets/logo-animated.svg', banner);
const backendAssets = path.resolve(root, '../motive-backend/assets');
if (fs.existsSync(path.resolve(root, '../motive-backend'))) {
  fs.mkdirSync(backendAssets, { recursive: true });
  fs.writeFileSync(path.join(backendAssets, 'logo-animated.svg'), banner);
  written.push('../motive-backend/assets/logo-animated.svg  (copy)');
}

// 5. Android sources for @capacitor/assets (see `npm run brand:android`).
await writePng('assets/icon-only.png', bleedSvg({ size: 1024 })); // legacy launcher icons
// Adaptive-icon foreground: @capacitor/assets insets this layer by 16.7% per side
// (see mipmap-anydpi-v26/ic_launcher.xml) to land it in Android's 66% safe zone,
// so the SOURCE image is fitted to the same 80% circle as a maskable icon — not
// pre-shrunk to 66%, which would shrink it twice and leave a tiny glyph.
await writePng('assets/icon-foreground.png', bleedSvg({ size: 1024, safeRadius: 0.4, background: 'none' }));
await writePng(
  'assets/icon-background.png',
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><defs>${bleedGradient()}</defs><rect width="1024" height="1024" fill="url(#g)"/></svg>`,
);
{
  const S = 2732;
  const splash = (bg, l) => `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs>${bg.defs}</defs>
  <rect width="${S}" height="${S}" fill="${bg.fill}"/>
  <g transform="translate(${Math.round((S - l.width) / 2)} ${Math.round((S - l.height) / 2)})">${l.inner}</g>
</svg>`;
  // Keep the lockup inside the central ~1200px the Android splash crop guarantees.
  await writePng('assets/splash.png', splash({ defs: bleedGradient(), fill: 'url(#g)' }, lockup({ markSize: 300, tile: false, ink: '#FFFFFF' })));
  await writePng('assets/splash-dark.png', splash({ defs: '', fill: C.surfaceDark }, lockup({ markSize: 300, tile: true, ink: '#FFFFFF' })));
}

console.log(written.map((w) => `  ${w}`).join('\n'));
console.log(`\n${written.length} entries. Next: npm run brand:android`);
