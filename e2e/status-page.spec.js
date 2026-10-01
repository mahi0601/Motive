import { test, expect } from '@playwright/test';
import { createUser, signIn } from './helpers';

// The whole path a client relies on: the owner writes the page details in
// Settings, and someone with only the link (no account, a fresh browser
// context) sees them, in the owner's accent colour.
test('the owner brands the status page and a client with only the link sees it', async ({ page, browser, request }) => {
  const user = await createUser(request, 'statuspage');
  await signIn(page, user);
  await page.goto('/settings');
  // The welcome dialog may be showing on a brand-new account.
  const welcome = page.locator('.fixed.inset-0.z-\\[70\\]');
  if (await welcome.count()) await welcome.click({ position: { x: 5, y: 5 } });

  await page.getByRole('button', { name: /create status link/i }).click();
  const link = await page.getByLabel('Status page link').inputValue();
  expect(link).toMatch(/\/s\/[0-9a-f]{64}$/);

  await page.getByLabel(/^headline/i).fill('Website redesign for Acme');
  await page.getByLabel(/^summary/i).fill('Phase 2 of 3: build and review.');
  await page.getByLabel(/next milestone name/i).fill('Design sign-off');
  await page.getByLabel(/next milestone date/i).fill('2026-12-01');
  await page.getByText('Violet', { exact: true }).click();
  await page.getByRole('button', { name: /^save$/i }).click();
  await expect(page.getByRole('status').filter({ hasText: /saved/i })).toBeVisible();

  // A client: a brand-new context with no cookies or storage.
  const client = await browser.newContext();
  const clientPage = await client.newPage();
  await clientPage.goto(link);
  await expect(clientPage.getByText('Website redesign for Acme')).toBeVisible();
  await expect(clientPage.getByText('Phase 2 of 3: build and review.')).toBeVisible();
  await expect(clientPage.getByRole('region', { name: /next milestone/i })).toContainText('Design sign-off');
  await expect(clientPage.locator('[data-accent="violet"]')).toHaveCount(1);
  await expect(clientPage.getByText(/powered by/i)).toBeVisible(); // free plan keeps the footer
  await client.close();
});
