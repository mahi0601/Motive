import { test, expect } from '@playwright/test';
import crypto from 'node:crypto';
import AxeBuilder from '@axe-core/playwright';
import { API, createUser, signIn } from './helpers';

// The weekly email to a client: the owner adds an address and sends themselves a preview, and the
// personal link that email carries opens the page and unsubscribes. The suite's backend runs with a
// dummy JWT secret (playwright.config.js) from which the link token is derived, as the server does.
const SECRET = 'e2e-only-dummy-secret-0000000000000000000000';
const tokenFor = (id) => 'c_' + crypto.createHmac('sha256', SECRET).update(`status-subscriber:${id}`).digest('base64url');
const CLIENT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// A backend from before this feature answers 404 here, so the test skips instead of failing.
const backendSupportsWeeklyEmail = async (request, auth, workspaceId) =>
  (await request.get(`${API}/api/workspaces/${workspaceId}/subscribers`, { headers: auth })).status() !== 404;

test('owner adds a client address, previews the email, and the client can unsubscribe', async ({ page, browser, request }) => {
  const user = await createUser(request, 'weeklyemail');
  const auth = { Authorization: `Bearer ${user.accessToken}` };
  const list = await (await request.get(`${API}/api/workspaces`, { headers: auth })).json();
  const workspaceId = list.workspaces[0].id;
  test.skip(!(await backendSupportsWeeklyEmail(request, auth, workspaceId)), 'backend has no weekly email yet');

  await request.post(`${API}/api/workspaces/${workspaceId}/share`, { headers: auth });
  await request.post(`${API}/api/tasks`, { headers: auth, data: { title: 'Design the logo', status: 'in_progress', workspaceId } });

  await signIn(page, user);
  await page.goto('/settings');
  const welcome = page.locator('.fixed.inset-0.z-\\[70\\]');
  if (await welcome.count()) await welcome.click({ position: { x: 5, y: 5 } });

  const card = page.getByRole('region', { name: /weekly email to your client/i });
  await expect(card).toBeVisible();
  await card.getByLabel(/client email address/i).fill('ann@client.example');
  await card.getByRole('button', { name: 'Add' }).click();
  await expect(card.getByText('ann@client.example')).toBeVisible();

  // A controlled checkbox: it flips once the save and the workspace reload come back.
  await card.getByLabel(/email my client every week/i).click();
  await expect(card.getByLabel(/email my client every week/i)).toBeChecked();
  await expect(card.getByLabel(/send on/i)).toBeVisible();

  await card.getByRole('button', { name: /send me a preview/i }).click();
  await expect(card.getByText(/preview sent to/i)).toBeVisible();

  const scan = await new AxeBuilder({ page }).include('section[aria-label="Weekly email to your client"]').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(scan.violations.filter((v) => ['serious', 'critical'].includes(v.impact)).map((v) => v.id)).toEqual([]);

  // The client's personal link opens the page, and the unsubscribe page works.
  const subs = await (await request.get(`${API}/api/workspaces/${workspaceId}/subscribers`, { headers: auth })).json();
  const token = tokenFor(subs.items[0].id);
  const client = await browser.newContext({ userAgent: CLIENT_UA });
  const clientPage = await client.newPage();
  await clientPage.goto(`/s/${token}?ref=digest`);
  await expect(clientPage.getByRole('heading', { level: 1 })).toBeVisible();
  await clientPage.goto(`/unsubscribe/${token}`);
  await clientPage.getByRole('button', { name: 'Unsubscribe' }).click();
  await expect(clientPage.getByText('You are unsubscribed')).toBeVisible();
  await client.close();

  await page.reload();
  await expect(page.getByRole('region', { name: /weekly email to your client/i }).getByText('unsubscribed')).toBeVisible();
});
