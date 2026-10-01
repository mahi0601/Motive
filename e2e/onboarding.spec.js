import { test, expect } from '@playwright/test';
import { createUser, signIn } from './helpers';

// A new account should land on a clear next step, and the sample project should
// give it something real to show a client straight away.
test('a new account sees the getting-started checklist and can add a sample client project', async ({ page, request }) => {
  const user = await createUser(request, 'onboarding');
  await signIn(page, user);

  // The one-time welcome dialog opens over a brand-new dashboard once its tasks
  // have loaded; wait for it, then click outside the panel to dismiss it.
  const welcome = page.locator('.fixed.inset-0.z-\\[70\\]');
  await expect(welcome).toBeVisible();
  await welcome.click({ position: { x: 5, y: 5 } });
  await expect(welcome).toHaveCount(0);

  const card = page.getByRole('region', { name: /getting started/i });
  await expect(card).toBeVisible();
  await expect(card.getByText('0 of 5 done')).toBeVisible();

  await card.getByRole('button', { name: /add a sample client project/i }).click();
  await expect(page.getByText('Sample: Draft homepage design')).toBeVisible();
  // The sample is not the user's own work, so progress has not moved.
  await expect(card.getByText('0 of 5 done')).toBeVisible();
  // With tasks present the sample offer is gone.
  await expect(card.getByRole('button', { name: /sample client project/i })).toHaveCount(0);

  // Hiding is remembered across a reload.
  await card.getByRole('button', { name: /hide getting started/i }).click();
  await page.reload();
  await expect(page.getByText('Sample: Draft homepage design')).toBeVisible();
  await expect(page.getByRole('region', { name: /getting started/i })).toHaveCount(0);
});
