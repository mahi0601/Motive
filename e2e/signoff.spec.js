import { test, expect } from '@playwright/test';
import { createUser, signIn, backendSupportsMilestones } from './helpers';

// A client approves the milestone: the public page shows it as approved (with
// the date, never the client's name), the owner has it in the sign-off record,
// and changing the milestone starts over.
test('a client approval is recorded, shown as a date, and cleared when the milestone changes', async ({ page, browser, request }) => {
  // The milestone fields in Settings now save through the milestones endpoint.
  const user = await createUser(request, 'signoff');
  test.skip(!(await backendSupportsMilestones(request, user)), 'needs a backend with milestones');
  await signIn(page, user);
  await page.goto('/settings');
  const welcome = page.locator('.fixed.inset-0.z-\\[70\\]');
  if (await welcome.count()) await welcome.click({ position: { x: 5, y: 5 } });

  await page.getByRole('button', { name: /create status link/i }).click();
  const link = await page.getByLabel('Status page link').inputValue();
  await page.getByLabel(/next milestone name/i).fill('Design sign-off');
  await page.getByLabel(/next milestone date/i).fill('2026-12-01');
  await page.getByRole('checkbox', { name: /let clients respond/i }).check();
  await page.getByRole('button', { name: /^save$/i }).click();
  await expect(page.getByRole('status').filter({ hasText: /saved/i })).toBeVisible();

  const client = await browser.newContext();
  const clientPage = await client.newPage();
  await clientPage.goto(link);
  const milestone = clientPage.getByRole('region', { name: /next milestone/i });
  await expect(milestone).toContainText('Design sign-off');
  await expect(milestone).not.toContainText(/approved/i);
  const respond = clientPage.getByRole('region', { name: /respond/i });
  await respond.getByLabel(/your name/i).fill('Ann Secret');
  await respond.getByRole('button', { name: /approve "design sign-off"/i }).click();
  await expect(respond.getByRole('status')).toContainText(/thanks/i);
  await clientPage.reload();
  await expect(milestone).toContainText(/approved on/i);
  await expect(clientPage.locator('body')).not.toContainText('Ann Secret');

  // The owner's record.
  await page.reload();
  await page.getByRole('button', { name: /^sign-offs$/i }).click();
  const record = page.getByRole('listitem', { name: 'Ann Secret' });
  await expect(record).toContainText('Design sign-off');
  await expect(page.getByRole('button', { name: /download sign-off record/i })).toBeEnabled();

  // Moving the milestone starts a clean slate.
  await page.getByLabel(/next milestone date/i).fill('2026-12-15');
  await page.getByRole('button', { name: /^save$/i }).click();
  await expect(page.getByRole('status').filter({ hasText: /saved/i })).toBeVisible();
  await clientPage.reload();
  await expect(milestone).not.toContainText(/approved/i);
  await client.close();
});
