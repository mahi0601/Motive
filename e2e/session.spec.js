import { test, expect } from '@playwright/test';
import { createUser, signIn } from './helpers';

// Regression: the refresh endpoint used to need an in-memory CSRF nonce, which a
// reload throws away — so every reload landed on /login.
test('a signed-in user is still signed in after a reload', async ({ page, request }) => {
  const user = await createUser(request, 'reload');
  await signIn(page, user);

  await page.reload();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByPlaceholder('you@example.com')).toHaveCount(0);

  // The session lives in the httpOnly refresh cookie, which survives the reload.
  const cookies = await page.context().cookies();
  expect(cookies.some((c) => c.name === 'motive_rt' && c.httpOnly)).toBe(true);
});
