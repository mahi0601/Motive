import { test, expect } from '@playwright/test';

// The example client page, reachable from the home page with no account. It is the real
// status page with made-up data, so a visitor sees what their client would see, and the
// response form works but sends nothing.
test('a visitor can open the example client page from the home page', async ({ page }) => {
  const apiCalls = [];
  page.on('request', (req) => {
    if (/\/api\/status\//.test(req.url())) apiCalls.push(req.url());
  });

  await page.goto('/');
  await page.getByRole('link', { name: /see an example client page/i }).click();
  await expect(page).toHaveURL(/\/demo$/);

  await expect(page.getByRole('note', { name: /example page/i })).toContainText(/made-up data/i);
  const timeline = page.getByRole('region', { name: /^milestones$/i });
  await expect(timeline.getByRole('listitem')).toHaveCount(3);
  await expect(timeline).toContainText(/approved on/i);
  await expect(page.getByRole('region', { name: /shipped this week/i })).toBeVisible();
  for (const name of ['Overdue', 'In flight', 'Not started', 'Shipped']) await expect(page.getByRole('region', { name, exact: true })).toBeVisible();

  // The response form works like the real one, but nothing is sent.
  const respond = page.getByRole('region', { name: /respond/i });
  await respond.getByLabel(/your name/i).fill('Ann');
  await respond.getByRole('button', { name: /^approve/i }).click();
  await expect(respond.getByRole('status')).toContainText(/thanks/i);
  await expect(respond).toContainText(/example only/i);
  expect(apiCalls).toEqual([]);

  // And it leads to sign-up.
  await page.getByRole('note', { name: /example page/i }).getByRole('link', { name: /start free/i }).click();
  await expect(page).toHaveURL(/\/register$/);
});
