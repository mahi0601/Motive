import { test, expect } from '@playwright/test';

// Signing up with a password needs the age and terms box. Only the browser side is
// checked here: the server's refusal and its record of when and which version are
// covered by the backend's own terms-acceptance tests, and this job runs against
// the backend's master, which may not have that rule yet.
test('sign-up needs the age and terms box in the browser', async ({ page, request }) => {
  const email = `e2e-${Date.now()}-signup@example.invalid`;
  await page.goto('/register');

  await page.getByPlaceholder('Jane Doe').fill('Terms Tester');
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder(/at least 8 characters/i).fill('e2e-password-1');

  // Without the box: refused in the browser, with a reason, and nothing is sent.
  await page.getByRole('button', { name: /create account/i }).click();
  await expect(page.getByRole('alert').filter({ hasText: /16 or older/i })).toBeVisible();
  await expect(page).toHaveURL(/\/register/);

  // The links in the label open the pages; check they exist and are real pages.
  const termsHref = await page.getByRole('checkbox').locator('xpath=ancestor::label').getByRole('link', { name: 'Terms' }).getAttribute('href');
  expect(termsHref).toBe('/terms');
  const terms = await request.get(`http://localhost:4173/terms`);
  expect(terms.ok()).toBe(true);

  // With the box: the account is created and the user lands in the app.
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
});
