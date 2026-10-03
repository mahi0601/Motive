import { Buffer } from 'node:buffer';
import { test, expect } from '@playwright/test';
import { API, createUser, signIn, backendSupportsImport } from './helpers';

// Bringing work in from another tool: the owner picks a CSV, sees what will happen
// (what was skipped and what had to be guessed), imports it, and the tasks are on the
// board and saved. A done task due in the past must not count as shipped.
const CSV = [
  'Card Name,Card Description,List Name,Due Date,Labels,Owner',
  'Design homepage,Hero and navigation,Doing,2026-11-05,"Design, Acme",Bob',
  ',Row with no title,Done,,,Ann',
  'Old kickoff call,,Done,2026-01-15,,Ann',
  'Send invoice,,Sprint 12,03/04/2026,,Ann',
].join('\n');

test('an owner imports tasks from a CSV and they are on the board', async ({ page, request }) => {
  const user = await createUser(request, 'import');
  test.skip(!(await backendSupportsImport(request, user)), 'needs a backend with task import');
  await signIn(page, user);
  const welcome = page.locator('.fixed.inset-0.z-\\[70\\]');
  await expect(welcome).toBeVisible();
  await welcome.click({ position: { x: 5, y: 5 } });
  await expect(welcome).toHaveCount(0);

  await page.getByRole('button', { name: 'Import' }).click();
  const dialog = page.getByRole('dialog', { name: /import tasks/i });
  await dialog.getByLabel(/choose a csv file/i).setInputFiles({ name: 'trello.csv', mimeType: 'text/csv', buffer: Buffer.from(CSV) });

  // What will happen is shown first.
  await expect(dialog.getByRole('status')).toContainText('3 tasks ready to import');
  await expect(dialog).toContainText(/“Card Name” as the title/);
  await expect(dialog).toContainText(/Not used: Owner/);
  await expect(dialog).toContainText(/row 3: no title/i); // skipped, counted as in the spreadsheet
  await expect(dialog).toContainText(/status that was not recognised/i);
  await expect(dialog).toContainText(/date was not recognised/i);

  await dialog.getByRole('button', { name: /import 3 tasks/i }).click();
  await expect(dialog.getByRole('status')).toContainText(/imported 3 tasks/i);
  await dialog.getByRole('button', { name: /^done$/i }).click();
  await expect(page.getByRole('dialog', { name: /import tasks/i })).toHaveCount(0);

  // On the board, and saved.
  await expect(page.getByText('Design homepage')).toBeVisible();
  await expect(page.getByText('Old kickoff call')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Send invoice')).toBeVisible();

  const auth = { Authorization: `Bearer ${user.accessToken}` };
  const { items } = await (await request.get(`${API}/api/tasks`, { headers: auth })).json();
  const byTitle = Object.fromEntries(items.map((t) => [t.title, t]));
  expect(byTitle['Design homepage']).toMatchObject({ status: 'in_progress', description: 'Hero and navigation', tags: ['Design', 'Acme'], category: 'Client work', priority: 'Medium' });
  expect(byTitle['Design homepage'].dueDate).toMatch(/^2026-11-05/);
  expect(byTitle['Send invoice']).toMatchObject({ status: 'todo', dueDate: null }); // the ambiguous date was left blank, not guessed
  expect(byTitle['Old kickoff call']).toMatchObject({ status: 'done' });
  expect(byTitle['Old kickoff call'].completedAt).toMatch(/^2026-01-15/); // dated from its due date, not "now"

  // Momentum does not count the imported backlog as shipped.
  const momentum = await (await request.get(`${API}/api/momentum?period=week`, { headers: auth })).json();
  expect(momentum.tiles.shipped.value).toBe(0);
});
