import { test, expect } from '@playwright/test';
import { API, createUser, signIn, backendSupportsRequests } from './helpers';

// The loop that closes "did you get my message?": a client with only the link asks for
// something, the owner accepts it as extra work (which puts a task on the board), the client
// sees it as planned and tagged, and when the task is done the client sees that too.
test('a client asks for something, the owner accepts it, and the client follows it to done', async ({ page, browser, request }) => {
  const user = await createUser(request, 'requests');
  test.skip(!(await backendSupportsRequests(request, user)), 'the backend does not have client requests yet');
  await signIn(page, user);
  await page.goto('/settings');
  const welcome = page.locator('.fixed.inset-0.z-\\[70\\]');
  if (await welcome.count()) await welcome.click({ position: { x: 5, y: 5 } });

  await page.getByRole('button', { name: /create status link/i }).click();
  const link = await page.getByLabel('Status page link').inputValue();
  await page.getByRole('checkbox', { name: /let clients ask for work/i }).check();
  await page.getByLabel(/requests included each month/i).fill('2');
  await page.getByRole('button', { name: /^save$/i }).click();
  await expect(page.getByRole('status').filter({ hasText: /saved/i })).toBeVisible();

  const client = await browser.newContext();
  const clientPage = await client.newPage();
  await clientPage.goto(link);
  const form = clientPage.getByRole('region', { name: /ask for something/i });
  await form.getByLabel(/your name/i).fill('Ann from Acme');
  await form.getByLabel(/what do you need/i).fill('Add a pricing page');
  await form.getByRole('button', { name: /send request/i }).click();
  await expect(form.getByRole('status')).toContainText(/thanks/i);
  await clientPage.reload();
  const list = clientPage.getByRole('region', { name: /your requests/i });
  await expect(list).toContainText('Add a pricing page');
  await expect(list).toContainText('Received');
  await expect(list).toContainText('0 of 2 included requests used this month');

  await page.reload();
  const inbox = page.getByRole('listitem', { name: 'Add a pricing page' });
  await expect(inbox).toContainText('Ann from Acme');
  await inbox.getByRole('button', { name: /accept add a pricing page as extra work/i }).click();
  await expect(inbox).toContainText(/on your board/i);
  await expect(page.getByText(/0 of 2 included used, 1 extra work/i)).toBeVisible();

  await clientPage.reload();
  await expect(list).toContainText('Planned');
  await expect(list).toContainText('Extra work');
  // Extra work is counted apart, not against the included requests.
  await expect(list).toContainText('0 of 2 included requests used this month');
  await expect(list).toContainText('1 extra work request this month');
  // The sender's name never reaches the public page.
  await expect(clientPage.getByText('Ann from Acme')).toHaveCount(0);

  const auth = { Authorization: `Bearer ${user.accessToken}` };
  const tasks = await (await request.get(`${API}/api/tasks`, { headers: auth })).json();
  const task = (tasks.tasks || tasks.items || tasks.data || []).find((t) => t.title === 'Add a pricing page');
  expect((await request.patch(`${API}/api/tasks/${task._id || task.id}`, { headers: auth, data: { status: 'done' } })).ok()).toBe(true);
  await clientPage.reload();
  await expect(list).toContainText('Done');
  await client.close();
});
