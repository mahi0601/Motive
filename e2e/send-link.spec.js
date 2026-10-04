import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createUser, signIn } from './helpers';

// The moment a link is created is the only time it can be seen, so the owner is offered a
// ready-written message right there. The link in that message must work for a real client.
const CLIENT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

test('after creating a link the owner can send it, and the link in the message opens the page', async ({ page, browser, request }) => {
  const user = await createUser(request, 'sendlink');
  await signIn(page, user);
  await page.goto('/settings');
  const welcome = page.locator('.fixed.inset-0.z-\\[70\\]');
  if (await welcome.count()) await welcome.click({ position: { x: 5, y: 5 } });

  await page.getByRole('button', { name: /create status link/i }).click();
  const panel = page.getByRole('region', { name: /send it to your client/i });
  await expect(panel).toBeVisible();

  // The message is ready and personal.
  await panel.getByLabel(/client's first name/i).fill('Ann');
  const text = panel.getByLabel(/message to your client/i);
  await expect(text).toHaveValue(/^Hi Ann,/);
  const link = await page.getByLabel('Status page link').inputValue();
  await expect(text).toHaveValue(new RegExp(link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

  // Email and WhatsApp carry exactly that text.
  const mail = await panel.getByRole('link', { name: /^email it$/i }).getAttribute('href');
  expect(mail.startsWith('mailto:?')).toBe(true);
  expect(new URLSearchParams(mail.slice(8)).get('body')).toContain(link);
  const wa = await panel.getByRole('link', { name: /whatsapp/i }).getAttribute('href');
  expect(decodeURIComponent(wa.replace('https://wa.me/?text=', ''))).toContain(link);

  // The panel is accessible.
  const scan = await new AxeBuilder({ page }).include('section[aria-label="Send it to your client"]').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(scan.violations.filter((v) => ['serious', 'critical'].includes(v.impact)).map((v) => v.id)).toEqual([]);

  // A client opening the link from the message sees the page.
  const client = await browser.newContext({ userAgent: CLIENT_UA });
  const clientPage = await client.newPage();
  const sent = (await text.inputValue()).split('\n').find((l) => l.startsWith('http'));
  await clientPage.goto(sent);
  await expect(clientPage.getByRole('heading', { level: 1 })).toBeVisible();
  await client.close();

  // Once the owner leaves, the link is gone, which is why the panel exists.
  await page.reload();
  await expect(page.getByRole('region', { name: /send it to your client/i })).toHaveCount(0);
});
