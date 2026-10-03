import { test, expect } from '@playwright/test';
import { createUser, signIn } from './helpers';

// The loop that replaces the update email: the owner switches responses on, a
// client with only the link asks for changes, and the owner sees it, both in the
// notification bell and in the inbox under the status page settings. (Which
// milestone a response names is covered by milestones.spec.js and signoff.spec.js.)
test('a client requests changes from the status page and the owner sees it', async ({ page, browser, request }) => {
  const user = await createUser(request, 'feedback');
  await signIn(page, user);
  await page.goto('/settings');
  const welcome = page.locator('.fixed.inset-0.z-\\[70\\]');
  if (await welcome.count()) await welcome.click({ position: { x: 5, y: 5 } });

  await page.getByRole('button', { name: /create status link/i }).click();
  const link = await page.getByLabel('Status page link').inputValue();
  await page.getByRole('checkbox', { name: /let clients respond/i }).check();
  await page.getByRole('button', { name: /^save$/i }).click();
  await expect(page.getByRole('status').filter({ hasText: /saved/i })).toBeVisible();

  const client = await browser.newContext();
  const clientPage = await client.newPage();
  await clientPage.goto(link);
  const respond = clientPage.getByRole('region', { name: /respond/i });
  await expect(respond).toBeVisible();
  await respond.getByLabel(/your name/i).fill('Ann from Acme');
  await respond.getByLabel(/^message/i).fill('Please make the logo bigger.');
  await respond.getByRole('button', { name: /request changes/i }).click();
  await expect(respond.getByRole('status')).toContainText(/thanks/i);
  await client.close();

  await page.reload();
  const inbox = page.getByRole('listitem', { name: 'Ann from Acme' });
  await expect(inbox).toContainText('Please make the logo bigger.');
  await expect(inbox).toContainText('Requested changes');
  await expect(page.getByText(/1 unread/)).toBeVisible();

  await page.getByRole('button', { name: /mark ann from acme.s feedback as read/i }).click();
  await expect(page.getByText(/0 unread/)).toBeVisible();
});
