export const API = 'http://localhost:5055';

// Creates a user through the API and returns what a test needs to sign in.
export async function createUser(request, label) {
  const email = `e2e-${Date.now()}-${label}@example.invalid`;
  const password = 'e2e-password-1';
  const res = await request.post(`${API}/api/auth/register`, { data: { name: `E2E ${label}`, email, password, acceptTerms: true } });
  if (!res.ok()) throw new Error(`register failed: ${res.status()}`);
  const body = await res.json();
  return { email, password, accessToken: body.accessToken, userId: body.user.id };
}

export async function signIn(page, { email, password }) {
  await page.goto('/login');
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await page.waitForURL('**/dashboard');
}

// Several milestones need a backend that has them. The browser tests in CI run
// against the backend's master, which may not have merged that yet, so a test that
// needs it checks first and skips itself, rather than failing the other repo's change.
// It uses the test's own user (a spare one would count against the sign-up limit).
export async function backendSupportsMilestones(request, user) {
  const auth = { Authorization: `Bearer ${user.accessToken}` };
  const list = await (await request.get(`${API}/api/workspaces`, { headers: auth })).json();
  const res = await request.put(`${API}/api/workspaces/${list.workspaces[0].id}/milestones`, { headers: auth, data: { milestones: [] } });
  return res.status() !== 404;
}

// Importing tasks needs a backend that has the endpoint; see backendSupportsMilestones.
export async function backendSupportsImport(request, user) {
  const res = await request.post(`${API}/api/tasks/import`, { headers: { Authorization: `Bearer ${user.accessToken}` }, data: { tasks: [] } });
  return res.status() !== 404;
}

// Client requests need a backend that has them; see backendSupportsMilestones.
export async function backendSupportsRequests(request, user) {
  const auth = { Authorization: `Bearer ${user.accessToken}` };
  const list = await (await request.get(`${API}/api/workspaces`, { headers: auth })).json();
  const res = await request.get(`${API}/api/workspaces/${list.workspaces[0].id}/requests`, { headers: auth });
  return res.status() !== 404;
}
