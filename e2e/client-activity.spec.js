import { test, expect } from '@playwright/test';
import { API, createUser, signIn } from './helpers';

// The owner finds out their client is looking. A real client opening the link shows up in
// Settings (last opened, visits this week) and as a notice in the app; a link preview bot
// (what Slack or WhatsApp sends when a link is pasted) gets the page but counts for nothing.
// (Playwright's headless Chromium announces itself as HeadlessChrome, which is rightly treated
// as a script, so the client here sends a realistic browser header.)
const CLIENT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const SLACK_UA = 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)';

test('the owner sees when a real client opens the page, and link previews do not count', async ({ page, browser, request }) => {
  const user = await createUser(request, 'activity');
  const auth = { Authorization: `Bearer ${user.accessToken}` };
  const get = async (path) => (await request.get(`${API}${path}`, { headers: auth })).json();

  // A backend from before this change has no engagement endpoint.
  const wsId = (await get('/api/workspaces')).workspaces[0].id;
  test.skip((await request.get(`${API}/api/workspaces/${wsId}/engagement`, { headers: auth })).status() === 404, 'needs a backend that reports client activity');

  await signIn(page, user);
  await page.goto('/settings');
  const welcome = page.locator('.fixed.inset-0.z-\\[70\\]');
  if (await welcome.count()) await welcome.click({ position: { x: 5, y: 5 } });
  await page.getByRole('button', { name: /create status link/i }).click();
  const link = await page.getByLabel('Status page link').inputValue();

  // Nobody has opened it yet.
  const activity = page.getByRole('region', { name: /client activity/i });
  await expect(activity).toContainText(/not opened yet/i);
  await expect(activity).toContainText(/link previews are not counted/i);

  // A link preview bot gets the page but is not a client looking.
  const bot = await browser.newContext({ userAgent: SLACK_UA });
  const botPage = await bot.newPage();
  await botPage.goto(link);
  await expect(botPage.getByRole('heading', { level: 1 })).toBeVisible();
  await bot.close();
  await new Promise((r) => setTimeout(r, 600));
  expect((await get(`/api/workspaces/${wsId}/engagement`)).views7d).toBe(0);

  // A real client opens it.
  const client = await browser.newContext({ userAgent: CLIENT_UA });
  const clientPage = await client.newPage();
  await clientPage.goto(link);
  await expect(clientPage.getByRole('heading', { level: 1 })).toBeVisible();
  await client.close();

  // The owner sees it in Settings...
  await expect.poll(async () => (await get(`/api/workspaces/${wsId}/engagement`)).visits7d, { timeout: 10_000 }).toBe(1);
  await page.reload();
  const after = page.getByRole('region', { name: /client activity/i });
  await expect(after).toContainText(/last opened just now/i);
  await expect(after).toContainText('1 visit in the last 7 days');

  // ...and as a notice, one, naming the page and nothing about who looked.
  await expect.poll(async () => (await get('/api/notifications')).items.filter((n) => n.type === 'client_view').length, { timeout: 10_000 }).toBe(1);
  const notice = (await get('/api/notifications')).items.find((n) => n.type === 'client_view');
  expect(notice.title).toMatch(/^Someone opened/);
  expect(JSON.stringify(notice)).not.toMatch(/Chrome|Slackbot|127\.0\.0\.1/);
});
