import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { API, createUser, signIn } from './helpers';

// Automated accessibility check (axe-core, WCAG 2.0/2.1 A and AA) on every main
// screen, in both themes. It catches the mechanical failures — unnamed buttons
// and selects, nested interactive controls, text that is too faint — not the
// whole of accessibility (that still needs keyboard and screen-reader testing).
// Only serious and critical findings fail the test.
const SCREENS_PUBLIC = [['home', '/'], ['login', '/login'], ['register', '/register'], ['forgot password', '/forgot-password'], ['privacy', '/privacy']];

async function violations(page) {
  await page.waitForTimeout(1500); // let entrance animations finish: axe would otherwise measure half-faded text
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  return result.violations
    .filter((v) => ['serious', 'critical'].includes(v.impact))
    .map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
}

for (const theme of ['light', 'dark']) {
  test(`no serious accessibility violations (${theme})`, async ({ page, request }) => {
    test.setTimeout(90_000);
    await page.addInitScript((t) => {
      try { localStorage.setItem('theme', t); } catch { /* storage unavailable */ }
    }, theme);
    await page.emulateMedia({ colorScheme: theme });

    const found = {};
    for (const [name, path] of SCREENS_PUBLIC) {
      await page.goto(path);
      found[name] = await violations(page);
    }

    const user = await createUser(request, `a11y-${theme}`);
    const auth = { Authorization: `Bearer ${user.accessToken}` };
    const created = await (await request.post(`${API}/api/pages`, { headers: auth, data: { title: 'A11y page' } })).json();
    const pageId = (created.page || created.data || created).id;
    await request.post(`${API}/api/pages/${pageId}/blocks`, { headers: auth, data: { type: 'paragraph', content: { html: 'hello' } } });
    await request.post(`${API}/api/tasks`, { headers: auth, data: { title: 'A task' } });

    await signIn(page, user);
    found.dashboard = await violations(page);
    for (const [name, path] of [['calendar', '/calendar'], ['momentum', '/momentum'], ['settings', '/settings'], ['profile', '/profile'], ['templates', '/templates'], ['page editor', `/page/${pageId}`]]) {
      await page.goto(path);
      found[name] = await violations(page);
    }

    const failing = Object.fromEntries(Object.entries(found).filter(([, v]) => v.length));
    expect(failing).toEqual({});
  });
}
