import { test, expect } from '@playwright/test';
import { API, createUser, signIn } from './helpers';

// Keeping a client as a reusable template: the owner saves a client, starts a new one from the
// template, and the new client has the structure but none of the first client's confidential
// material. Deleting the template leaves the new client alone.
test('an owner saves a client as a template and starts a new client from it', async ({ page, request }) => {
  const user = await createUser(request, 'template');
  const auth = { Authorization: `Bearer ${user.accessToken}` };
  const get = async (path) => (await request.get(`${API}${path}`, { headers: auth })).json();
  const post = (path, data) => request.post(`${API}${path}`, { headers: auth, data });

  // A backend from before this change does not have the endpoint.
  test.skip((await request.get(`${API}/api/client-templates`, { headers: auth })).status() === 404, 'needs a backend with client templates');

  const sourceId = (await get('/api/workspaces')).workspaces[0].id;
  const task = (await (await post('/api/tasks', { title: 'Kickoff call', status: 'done', workspaceId: sourceId, dueDate: '2026-10-01' })).json()).task;
  await post('/api/tasks', { title: 'First review', status: 'in_progress', workspaceId: sourceId, dueDate: '2026-10-11' });
  await post('/api/comments', { taskId: task.id, text: 'CONFIDENTIAL CLIENT COMMENT' });
  const pageId = (await (await post('/api/pages', { title: 'Project brief', workspaceId: sourceId })).json()).page.id;
  await post(`/api/pages/${pageId}/blocks`, { type: 'paragraph', content: { text: 'Agree the scope' } });
  await post(`/api/pages/${pageId}/blocks`, { type: 'image', content: { url: 'https://api.example.test/uploads/logo.png' } });

  await signIn(page, user);
  await page.goto('/settings');

  // Save the first client as a template.
  await page.getByRole('button', { name: /save as client template/i }).click();
  const save = page.getByRole('dialog', { name: /save as client template/i });
  await expect(save).toContainText(/not saved/i);
  await save.getByLabel(/template name/i).fill('Website project');
  await save.getByRole('button', { name: /save template/i }).click();
  await expect(page.getByText(/saved “website project” as a client template/i)).toBeVisible();

  // Start a new client from it.
  await page.getByRole('button', { name: /^client templates$/i }).click();
  const list = page.getByRole('dialog', { name: /^client templates$/i });
  const entry = list.getByRole('listitem', { name: 'Website project' });
  await expect(entry).toContainText('2 tasks · 1 page · 0 milestones');
  await entry.getByRole('button', { name: /use website project/i }).click();
  await list.getByLabel(/name of the new client/i).fill('Beta Co');
  await list.getByLabel(/start date/i).fill('2027-03-01');
  await list.getByRole('button', { name: /create client/i }).click();
  await expect(page.getByText(/created “beta co” from a template: 2 tasks, 1 page/i)).toBeVisible();

  // What the new client holds, from the API.
  const copy = (await get('/api/workspaces')).workspaces.find((w) => w.name === 'Beta Co');
  expect(copy.ownerId).toBe(user.userId);
  const { items } = await get(`/api/tasks?workspaceId=${copy.id}`);
  expect(items.map((t) => [t.title, t.status]).sort()).toEqual([['First review', 'todo'], ['Kickoff call', 'todo']]);
  expect(Object.fromEntries(items.map((t) => [t.title, t.dueDate?.slice(0, 10)]))).toEqual({ 'Kickoff call': '2027-03-01', 'First review': '2027-03-11' });
  const pages = (await get(`/api/pages?workspaceId=${copy.id}`)).pages;
  const blocks = (await get(`/api/pages/${pages[0].id}/blocks`)).blocks;
  const text = JSON.stringify(blocks.map((b) => b.content));
  expect(text).toContain('Agree the scope');
  expect(text).not.toContain('logo.png');
  expect(JSON.stringify(items)).not.toContain('CONFIDENTIAL');

  // The saved template itself holds nothing confidential either.
  const stored = JSON.stringify((await get('/api/client-templates')).templates);
  expect(stored).not.toMatch(/CONFIDENTIAL|logo\.png/);

  // Deleting the template leaves the client made from it.
  await page.getByRole('button', { name: /^client templates$/i }).click();
  const again = page.getByRole('dialog', { name: /^client templates$/i });
  await again.getByRole('button', { name: 'Delete Website project' }).click();
  await again.getByRole('button', { name: /confirm delete website project/i }).click();
  await expect(again.getByText(/no templates yet/i)).toBeVisible();
  expect((await get('/api/client-templates')).templates).toEqual([]);
  expect((await get('/api/workspaces')).workspaces.some((w) => w.name === 'Beta Co')).toBe(true);
});
