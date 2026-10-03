import { test, expect } from '@playwright/test';
import { createUser, signIn, backendSupportsMilestones } from './helpers';

// A status page with several milestones: the owner lists them in Settings, a client
// with only the link sees the timeline and approves ONE of them, and later edits
// reset only the milestone that was edited. The second save happens without a
// reload on purpose: the form must have kept each milestone's id, or it would send
// them as new and lose the approval.
test('an owner lists several milestones and a client approves one of them', async ({ page, browser, request }) => {
  const user = await createUser(request, 'milestones');
  test.skip(!(await backendSupportsMilestones(request, user)), 'needs a backend with milestones');
  await signIn(page, user);
  await page.goto('/settings');
  const welcome = page.locator('.fixed.inset-0.z-\\[70\\]');
  if (await welcome.count()) await welcome.click({ position: { x: 5, y: 5 } });

  await page.getByRole('button', { name: /create status link/i }).click();
  const link = await page.getByLabel('Status page link').inputValue();

  const save = async () => {
    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(page.getByRole('status').filter({ hasText: /saved/i })).toBeVisible();
  };

  await page.getByLabel(/next milestone name/i).fill('Design sign-off');
  await page.getByLabel(/next milestone date/i).fill('2026-12-01');
  await page.getByRole('button', { name: /add milestone/i }).click();
  await page.getByLabel(/milestone 2 name/i).fill('Build complete');
  await page.getByRole('button', { name: /add milestone/i }).click();
  await page.getByLabel(/milestone 3 name/i).fill('Launch');
  await page.getByRole('checkbox', { name: /let clients respond/i }).check();
  await save();

  // A client with only the link sees the timeline, in order.
  const client = await browser.newContext();
  const clientPage = await client.newPage();
  await clientPage.goto(link);
  const items = clientPage.getByRole('region', { name: /^milestones$/i }).getByRole('listitem');
  await expect(items).toHaveCount(3);
  await expect(items.nth(0)).toContainText('Design sign-off');
  await expect(items.nth(1)).toContainText('Build complete');
  await expect(items.nth(2)).toContainText('Launch');

  // They approve the second one only.
  const respond = clientPage.getByRole('region', { name: /respond/i });
  await respond.getByLabel(/^milestone$/i).selectOption({ label: 'Build complete' });
  await respond.getByLabel(/your name/i).fill('Ann Secret');
  await respond.getByRole('button', { name: /approve "build complete"/i }).click();
  await expect(respond.getByRole('status')).toContainText(/thanks/i);
  await clientPage.reload();
  await expect(items.nth(1)).toContainText(/approved on/i);
  await expect(items.nth(0)).not.toContainText(/approved/i);
  await expect(items.nth(2)).not.toContainText(/approved/i);
  await expect(clientPage.locator('body')).not.toContainText('Ann Secret');

  // The owner's record names the milestone.
  await page.reload();
  await page.getByRole('button', { name: /^sign-offs$/i }).click();
  await expect(page.getByRole('listitem', { name: 'Ann Secret' })).toContainText('Build complete');

  // Editing ANOTHER milestone leaves the approval alone (no reload since the last save).
  await page.getByLabel(/next milestone date/i).fill('2026-12-15');
  await save();
  await clientPage.reload();
  await expect(items.nth(1)).toContainText(/approved on/i);

  // Reordering keeps each approval with its milestone.
  await page.getByRole('button', { name: /move milestone 3 up/i }).click();
  await save();
  await clientPage.reload();
  await expect(items.nth(1)).toContainText('Launch');
  await expect(items.nth(2)).toContainText('Build complete');
  await expect(items.nth(2)).toContainText(/approved on/i);

  // Renaming the approved milestone starts it over.
  await page.getByLabel(/milestone 3 name/i).fill('Build finished');
  await save();
  await clientPage.reload();
  await expect(items.nth(2)).toContainText('Build finished');
  await expect(items.nth(2)).not.toContainText(/approved/i);
  await client.close();
});
