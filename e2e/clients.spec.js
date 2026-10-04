import { test, expect } from '@playwright/test';
import { API, createUser, signIn } from './helpers';

// The Clients overview: a Monday-morning list of every client, most in need first. Two clients,
// one with overdue work and an unread reply from its client, one healthy: the needy one leads,
// says why in words, and opening a client goes to that client's board.
test('the owner sees which client needs attention first, and can open it', async ({ page, request }) => {
  const user = await createUser(request, 'clients');
  const auth = { Authorization: `Bearer ${user.accessToken}` };
  const get = async (path) => (await request.get(`${API}${path}`, { headers: auth })).json();
  const post = (path, data) => request.post(`${API}${path}`, { headers: auth, data });

  // A backend from before this change has no overview endpoint.
  test.skip((await request.get(`${API}/api/workspaces/overview`, { headers: auth })).status() === 404, 'needs a backend with the clients overview');

  const first = (await get('/api/workspaces')).workspaces[0];
  await request.patch(`${API}/api/workspaces/${first.id}`, { headers: auth, data: { name: 'Zed Studio' } }).catch(() => {});
  const needy = (await (await post('/api/workspaces', { name: 'Needs Me Ltd' })).json()).workspace;
  const healthy = (await (await post('/api/workspaces', { name: 'All Good Co' })).json()).workspace;

  // The needy client: an overdue task, a live link that allows replies, and one reply from its client.
  await post('/api/tasks', { title: 'Late deliverable', workspaceId: needy.id, dueDate: '2020-01-01' });
  await request.patch(`${API}/api/workspaces/${needy.id}/status-page`, { headers: auth, data: { allowFeedback: true } });
  const token = (await (await post(`/api/workspaces/${needy.id}/share`, {})).json()).share.token;
  await request.post(`${API}/api/status/${token}/feedback`, { data: { kind: 'comment', name: 'Ann', message: 'Quick question' } });
  await post('/api/tasks', { title: 'On track', workspaceId: healthy.id, dueDate: '2099-01-01' });

  await signIn(page, user);
  await page.getByRole('link', { name: 'Clients', exact: true }).click();
  await expect(page).toHaveURL(/\/clients$/);

  const items = page.getByRole('list', { name: /^clients$/i }).getByRole('listitem');
  await expect(items.first().getByRole('heading')).toHaveText('Needs Me Ltd');
  await expect(items.first()).toContainText('1 task overdue');
  await expect(items.first()).toContainText('1 unread reply');
  await expect(items.first()).toContainText('Live link');
  const healthyRow = items.filter({ has: page.getByRole('heading', { name: 'All Good Co' }) });
  await expect(healthyRow).toContainText('No link yet');
  await expect(healthyRow).not.toContainText(/needs attention/i);
  await expect(page.getByText(/1 of 3 clients need attention/i)).toBeVisible();

  // Opening a client goes to its board.
  await page.getByRole('button', { name: 'Open All Good Co' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  // The board shows this client's work, not the other client's. (The digest and activity widgets
  // beside it list work across every client, so only the board columns are checked.)
  const board = page.locator('[data-rfd-droppable-id]');
  await expect(board.getByText('On track')).toBeVisible();
  await expect(board.getByText('Late deliverable')).toHaveCount(0);
});
