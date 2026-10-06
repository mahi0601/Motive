// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const read = (f) => readFileSync(fileURLToPath(new URL(`../${f}`, import.meta.url)), 'utf8');

// The theme script in index.html runs before the app so there is no flash of the wrong theme. The
// policy allows exactly that script by hash instead of 'unsafe-inline' (which would also allow any
// injected script). If the script is edited, its hash changes: this fails until the policy files are
// updated, rather than the page silently losing its theme script in production.
describe('Content-Security-Policy', () => {
  const html = read('index.html');
  const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);

  test('index.html has exactly one inline script', () => {
    expect(inline).toHaveLength(1);
  });

  test.each(['netlify.toml', 'nginx.conf', 'README.md'])('%s allows that script by hash, and not by unsafe-inline', (file) => {
    const hash = `sha256-${createHash('sha256').update(inline[0]).digest('base64')}`;
    const text = read(file);
    expect(text).toContain(`'${hash}'`);
    expect(text).not.toMatch(/script-src[^;]*'unsafe-inline'/);
  });
});
