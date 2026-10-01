import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import GettingStartedCard from './GettingStartedCard';

const addPage = vi.fn();
const loadWorkspace = vi.fn();
let workspaceValue;
let userValue;
vi.mock('../../context/WorkspaceContext', () => ({ useWorkspace: () => ({ ...workspaceValue, addPage, loadWorkspace }) }));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: userValue }) }));

const renderCard = (props = {}) =>
  render(
    <MemoryRouter>
      <GettingStartedCard tasks={[]} createTask={vi.fn().mockResolvedValue({})} onAddTask={vi.fn()} {...props} />
    </MemoryRouter>
  );

describe('GettingStartedCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    addPage.mockResolvedValue({ id: 'p1' });
    workspaceValue = { workspace: { members: [{}], shareEnabledAt: null }, pages: [] };
    userValue = { id: 'u1', emailVerifiedAt: null };
  });

  test('shows real progress and the steps still to do', () => {
    renderCard({ tasks: [{ id: 't1', title: 'Real' }] });
    expect(screen.getByText(/1 of 5 done/i)).toBeTruthy();
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('1');
    expect(screen.getByRole('button', { name: /share a live status link/i })).toBeTruthy();
  });

  test('"Add a task" opens the task form', () => {
    const onAddTask = vi.fn();
    renderCard({ onAddTask });
    fireEvent.click(screen.getByRole('button', { name: /add your first task/i }));
    expect(onAddTask).toHaveBeenCalled();
  });

  test('the sample project creates the labelled tasks and a page, then refreshes the workspace', async () => {
    const createTask = vi.fn().mockResolvedValue({});
    renderCard({ createTask });
    fireEvent.click(screen.getByRole('button', { name: /add a sample client project/i }));
    await waitFor(() => expect(addPage).toHaveBeenCalledTimes(1));
    expect(createTask).toHaveBeenCalledTimes(4);
    expect(createTask.mock.calls.every(([t]) => t.title.startsWith('Sample:'))).toBe(true);
    const due = createTask.mock.calls.map(([t]) => t.dueDate).filter(Boolean);
    expect(due.length).toBeGreaterThanOrEqual(2);
    expect(due.every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))).toBe(true);
  });

  test('the sample offer is only shown while the account has no tasks', () => {
    renderCard({ tasks: [{ id: 't1' }] });
    expect(screen.queryByRole('button', { name: /sample client project/i })).toBeNull();
  });

  test('a failed sample explains itself instead of failing silently', async () => {
    renderCard({ createTask: vi.fn().mockRejectedValue(new Error('boom')) });
    fireEvent.click(screen.getByRole('button', { name: /add a sample client project/i }));
    expect(await screen.findByRole('alert')).toBeTruthy();
  });

  test('can be hidden, and stays hidden', () => {
    const { unmount } = renderCard();
    fireEvent.click(screen.getByRole('button', { name: /hide/i }));
    expect(screen.queryByText(/getting started/i)).toBeNull();
    unmount();
    renderCard();
    expect(screen.queryByText(/getting started/i)).toBeNull();
  });

  test('disappears by itself once every step is done', () => {
    workspaceValue = { workspace: { members: [{}, {}], shareEnabledAt: '2026-01-01' }, pages: [{ id: 'p', title: 'Brief' }] };
    userValue = { id: 'u1', emailVerifiedAt: '2026-01-01' };
    renderCard({ tasks: [{ id: 't', title: 'Real' }] });
    expect(screen.queryByText(/getting started/i)).toBeNull();
  });
});
