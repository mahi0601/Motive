import { Buffer } from 'node:buffer';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { API, createUser, signIn } from './helpers';

// Automated accessibility check (axe-core, WCAG 2.0/2.1 A and AA) on every main
// screen, in both themes. It catches the mechanical failures — unnamed buttons
// and selects, nested interactive controls, text that is too faint — not the
// whole of accessibility (that still needs keyboard and screen-reader testing).
// Only serious and critical findings fail the test.
const SCREENS_PUBLIC = [['home', '/'], ['login', '/login'], ['register', '/register'], ['forgot password', '/forgot-password'], ['privacy', '/privacy'], ['terms', '/terms'], ['example client page', '/demo']];

async function firstWorkspaceId(request, auth) {
  const res = await (await request.get(`${API}/api/workspaces`, { headers: auth })).json();
  const ws = res.workspaces[0];
  await request.patch(`${API}/api/workspaces/${ws.id}/status-page`, {
    headers: auth,
    data: { headline: 'Website redesign', summary: 'Phase 2 of 3.', milestoneTitle: 'Design sign-off', milestoneDate: '2026-12-01', accent: 'amber', allowFeedback: true },
  });
  // A longer timeline too, so the several-milestones layout is audited. A backend
  // without milestones answers 404 and the single milestone above is what is audited.
  await request.put(`${API}/api/workspaces/${ws.id}/milestones`, {
    headers: auth,
    data: { milestones: [{ title: 'Design sign-off', date: '2026-12-01' }, { title: 'Build complete', date: '2027-01-15' }, { title: 'Launch' }] },
  });
  return ws.id;
}

async function violations(page) {
  await page.waitForTimeout(1500); // let entrance animations finish: axe would otherwise measure half-faded text
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  return result.violations
    .filter((v) => ['serious', 'critical'].includes(v.impact))
    .map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 6).map((n) => `${n.target.join(' ')} [${(n.any[0]?.message || '').slice(0, 130)}]`).join(' | ')}`);
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

    // The public status page, as a client sees it, with every part switched on.
    const share = await (await request.post(`${API}/api/workspaces/${await firstWorkspaceId(request, auth)}/share`, { headers: auth })).json();
    // An approved milestone, so that state is audited too.
    await request.post(`${API}/api/status/${share.share.token}/feedback`, { data: { kind: 'approve', name: 'Audit Client' } });
    found['status page'] = [];
    await page.goto(`/s/${share.share.token}`);
    found['status page'] = await violations(page);

    await signIn(page, user);
    found.dashboard = await violations(page);
    // The import dialog with a file chosen, so the preview table and warnings are audited.
    // (The one-time welcome dialog may be showing over a brand-new dashboard.)
    const welcome = page.locator('.fixed.inset-0.z-\\[70\\]');
    if (await welcome.count()) await welcome.click({ position: { x: 5, y: 5 } });
    await page.getByRole('button', { name: 'Import' }).click();
    await page.getByLabel(/choose a csv file/i).setInputFiles({
      name: 'tasks.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('Card Name,List Name,Due Date,Owner\nDesign homepage,Doing,2026-11-05,Bob\n,Done,,Ann\nSend invoice,Sprint 12,03/04/2026,Ann'),
    });
    await expect(page.getByRole('table', { name: /preview/i })).toBeVisible();
    found['import dialog'] = await violations(page);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: /import tasks/i })).toHaveCount(0);
    for (const [name, path] of [['clients', '/clients'], ['calendar', '/calendar'], ['momentum', '/momentum'], ['settings', '/settings'], ['profile', '/profile'], ['templates', '/templates'], ['page editor', `/page/${pageId}`]]) {
      await page.goto(path);
      found[name] = await violations(page);
    }

    const failing = Object.fromEntries(Object.entries(found).filter(([, v]) => v.length));
    expect(failing).toEqual({});
  });
}
