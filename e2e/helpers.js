export const API = 'http://localhost:5055';

// Creates a user through the API and returns what a test needs to sign in.
export async function createUser(request, label) {
  const email = `e2e-${Date.now()}-${label}@example.invalid`;
  const password = 'e2e-password-1';
  const res = await request.post(`${API}/api/auth/register`, { data: { name: `E2E ${label}`, email, password } });
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

// Importing tasks needs a backend that has the endpoint; see backendSupportsMilestones.
export async function backendSupportsImport(request, user) {
  const res = await request.post(`${API}/api/tasks/import`, { headers: { Authorization: `Bearer ${user.accessToken}` }, data: { tasks: [] } });
  return res.status() !== 404;
}
