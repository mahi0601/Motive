import { test, expect } from '@playwright/test';
import { API, createUser, signIn } from './helpers';

// What finished this week reaches the client two ways: the page shows it to them, and
// the owner can copy a ready-made update to paste into a message.
test('shipped work shows on the client page and in the owner\'s weekly update', async ({ page, browser, request, context }) => {
  const user = await createUser(request, 'weekly');
  const auth = { Authorization: `Bearer ${user.accessToken}` };
  const { workspaces } = await (await request.get(`${API}/api/workspaces`, { headers: auth })).json();
  const wsId = workspaces[0].id;
  await request.post(`${API}/api/tasks`, { headers: auth, data: { title: 'Launch banner', status: 'done', workspaceId: wsId } });
  await request.post(`${API}/api/tasks`, { headers: auth, data: { title: 'Build API', status: 'in_progress', workspaceId: wsId } });
  const share = await (await request.post(`${API}/api/workspaces/${wsId}/share`, { headers: auth })).json();
  const link = `http://localhost:4173/s/${share.share.token}`;

  // A backend from before this change does not report shipped work.
  const status = await (await request.get(`${API}/api/status/${share.share.token}`)).json();
  test.skip(!status.status.recent, 'needs a backend that reports shipped work');

  // The client's view.
  const client = await browser.newContext();
  const clientPage = await client.newPage();
  await clientPage.goto(link);
  const shipped = clientPage.getByRole('region', { name: /shipped this week/i });
  await expect(shipped).toContainText('1 task shipped');
  await expect(shipped).toContainText('Launch banner');
  await expect(shipped).not.toContainText('Build API');
  // The weekly chart too, when the backend sends it: one task finished this week.
  if (status.status.throughput) {
    await expect(clientPage.getByRole('region', { name: /shipped each week/i })).toContainText('1 task shipped in the last 8 weeks');
  }
  await client.close();

  // The owner's weekly update.
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await signIn(page, user);
  await page.getByRole('button', { name: 'Weekly update' }).click();
  const dialog = page.getByRole('dialog', { name: /weekly update/i });
  const text = dialog.getByLabel(/update text/i);
  await expect(text).toHaveValue(/Shipped this week \(1\)/);
  await expect(text).toHaveValue(/Launch banner/);
  await expect(text).toHaveValue(/In progress \(1\)/);
  await dialog.getByRole('button', { name: /copy to clipboard/i }).click();
  await expect(dialog.getByRole('status')).toContainText(/copied/i);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/Launch banner/);
});
