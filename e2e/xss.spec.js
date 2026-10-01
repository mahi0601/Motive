import { test, expect } from '@playwright/test';
import { API, createUser, signIn } from './helpers';

// A block saved through the API (so the editor's own sanitizer never ran) with
// markup that used to reach the live document's innerHTML before DOMPurify:
// the img handler fires when the element is parsed, even if never attached.
test('saved block content with an inline handler inside a styled span never executes', async ({ page, request }) => {
  const user = await createUser(request, 'xss');
  const auth = { Authorization: `Bearer ${user.accessToken}` };
  const pageRes = await request.post(`${API}/api/pages`, { headers: auth, data: { title: 'XSS probe' } });
  const { page: created } = await pageRes.json().then((b) => ({ page: b.page || b.data || b }));
  await request.post(`${API}/api/pages/${created.id}/blocks`, {
    headers: auth,
    data: {
      type: 'paragraph',
      content: { html: 'safe <span style="font-weight:bold"><img src=x onerror="window.__pwned=1;alert(1)"></span> text' },
    },
  });

  const dialogs = [];
  page.on('dialog', async (d) => {
    dialogs.push(d.message());
    await d.dismiss();
  });

  await signIn(page, user);
  await page.goto(`/page/${created.id}`);
  await expect(page.getByText('safe')).toBeVisible();
  await page.waitForTimeout(500); // an onerror handler would have fired by now

  expect(dialogs).toEqual([]);
  expect(await page.evaluate(() => window.__pwned)).toBeUndefined();
  expect(await page.locator('img[onerror]').count()).toBe(0);
});
