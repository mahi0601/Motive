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

// Pasting rich content from elsewhere (Word, a web page) must not put anything but
// the editor's own marks into the page, and must not run handlers while doing it.
test('pasted HTML is cleaned before it enters the editor', async ({ page, request }) => {
  const user = await createUser(request, 'paste');
  const auth = { Authorization: `Bearer ${user.accessToken}` };
  const pageRes = await request.post(`${API}/api/pages`, { headers: auth, data: { title: 'Paste probe' } });
  const { page: created } = await pageRes.json().then((b) => ({ page: b.page || b.data || b }));
  await request.post(`${API}/api/pages/${created.id}/blocks`, { headers: auth, data: { type: 'paragraph', content: { html: 'start ' } } });

  const dialogs = [];
  page.on('dialog', async (d) => {
    dialogs.push(d.message());
    await d.dismiss();
  });

  await signIn(page, user);
  await page.goto(`/page/${created.id}`);
  // The page title is editable too; the block is the one that starts with our text.
  const editable = page.locator('[contenteditable="true"]', { hasText: 'start' }).first();
  await expect(editable).toContainText('start');
  await editable.click();
  await page.keyboard.press('End');

  await editable.evaluate((node) => {
    const data = new DataTransfer();
    data.setData('text/html', '<meta charset="utf-8"><b>bold</b> <span style="color:red;font-size:40px">styled</span><img src=x onerror="window.__pasted=1;alert(1)"><script>window.__pasted=2</script>');
    data.setData('text/plain', 'bold styled');
    node.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
  });
  await page.waitForTimeout(400);

  // Only the editor's own marks remain. (Whitespace around the paste point is the
  // browser's to normalise, so the check is on structure, not on exact spaces.)
  expect(await editable.locator('b').allInnerTexts()).toEqual(['bold']);
  expect(await editable.locator('img, script, span, [style], [onerror]').count()).toBe(0);
  expect(await editable.innerText()).toMatch(/start\s*bold\s*styled/);
  expect(dialogs).toEqual([]);
  expect(await page.evaluate(() => window.__pasted)).toBeUndefined();
});
