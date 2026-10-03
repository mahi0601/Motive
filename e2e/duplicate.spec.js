import { test, expect } from '@playwright/test';
import { API, createUser, signIn } from './helpers';

// Starting the next client from an existing one. The owner copies a project; the copy has the
// tasks (reset to To do) and pages, and none of the first client's confidential material: an
// image block becomes a placeholder, and comments stay behind.
test('an owner starts a new client from an existing one without carrying the first client\'s material', async ({ page, request }) => {
  const user = await createUser(request, 'duplicate');
  const auth = { Authorization: `Bearer ${user.accessToken}` };
  const get = async (path) => (await request.get(`${API}${path}`, { headers: auth })).json();
  const post = (path, data) => request.post(`${API}${path}`, { headers: auth, data });

  // A backend from before this change does not have the endpoint.
  const sourceId = (await get('/api/workspaces')).workspaces[0].id;
  test.skip((await post(`/api/workspaces/${sourceId}/duplicate`, {})).status() === 404, 'needs a backend that can copy a client');

  // The first client: a done task with a comment, and a page holding a normal block and an image.
  const task = (await (await post('/api/tasks', { title: 'Kickoff call', status: 'done', workspaceId: sourceId, dueDate: '2026-10-01' })).json()).task;
  await post('/api/tasks', { title: 'First review', status: 'in_progress', workspaceId: sourceId, dueDate: '2026-10-11' });
  await post('/api/comments', { taskId: task.id, text: 'CONFIDENTIAL CLIENT COMMENT' });
  const pageId = (await (await post('/api/pages', { title: 'Project brief', workspaceId: sourceId })).json()).page.id;
  await post(`/api/pages/${pageId}/blocks`, { type: 'paragraph', content: { text: 'Agree the scope' } });
  await post(`/api/pages/${pageId}/blocks`, { type: 'image', content: { url: 'https://api.example.test/uploads/logo.png' } });

  await signIn(page, user);
  await page.goto('/settings');
  await page.getByRole('button', { name: /new client from this one/i }).click();
  const dialog = page.getByRole('dialog', { name: /new client from this one/i });
  await expect(dialog).toContainText(/not copied/i);
  await dialog.getByLabel(/name of the new client/i).fill('Beta Co');
  await dialog.getByLabel(/start date/i).fill('2027-03-01');
  await dialog.getByRole('button', { name: /create client/i }).click();
  await expect(page.getByText(/created “beta co” from this one: 2 tasks, 1 page/i)).toBeVisible();

  // What the copy holds, from the API.
  const copy = (await get('/api/workspaces')).workspaces.find((w) => w.name === 'Beta Co');
  expect(copy.ownerId).toBe(user.userId);
  expect(copy.members).toHaveLength(1);
  const { items } = await get(`/api/tasks?workspaceId=${copy.id}`);
  expect(items.map((t) => [t.title, t.status]).sort()).toEqual([['First review', 'todo'], ['Kickoff call', 'todo']]);
  const dates = Object.fromEntries(items.map((t) => [t.title, t.dueDate?.slice(0, 10)]));
  expect(dates).toEqual({ 'Kickoff call': '2027-03-01', 'First review': '2027-03-11' }); // the gap of ten days is kept

  const pages = (await get(`/api/pages?workspaceId=${copy.id}`)).pages;
  expect(pages.map((p) => p.title)).toEqual(['Project brief']);
  const blocks = (await get(`/api/pages/${pages[0].id}/blocks`)).blocks;
  const text = JSON.stringify(blocks.map((b) => b.content));
  expect(text).toContain('Agree the scope');
  expect(text).not.toContain('logo.png');
  expect(blocks.some((b) => b.type === 'image')).toBe(false);
  expect(text).toMatch(/not copied/i);
  expect(JSON.stringify(await get(`/api/tasks?workspaceId=${copy.id}`))).not.toContain('CONFIDENTIAL');

  // And the first client is untouched.
  const original = (await get(`/api/tasks?workspaceId=${sourceId}`)).items.map((t) => [t.title, t.status]).sort();
  expect(original).toEqual([['First review', 'in_progress'], ['Kickoff call', 'done']]);
});
