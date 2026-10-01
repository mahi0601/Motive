import React from 'react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import StatusPage from './StatusPage';
import { getStatus } from '../services/statusService';

vi.mock('../services/statusService', () => ({ getStatus: vi.fn() }));

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/s/abc123']}>
      <Routes>
        <Route path="/s/:token" element={<StatusPage />} />
      </Routes>
    </MemoryRouter>
  );

const FUTURE = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
const PAST = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

describe('StatusPage', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.useRealTimers());

  test('shows the workspace, overall progress and tasks grouped by state', async () => {
    getStatus.mockResolvedValue({
      data: {
        status: {
          workspace: { name: 'Acme Redesign', icon: '🚀' },
          summary: { todo: 1, in_progress: 1, done: 1, total: 3, percent: 33 },
          tasks: [
            { title: 'Write copy', status: 'todo', dueDate: PAST, completedAt: null },
            { title: 'Build API', status: 'in_progress', dueDate: FUTURE, completedAt: null },
            { title: 'Design homepage', status: 'done', dueDate: null, completedAt: PAST },
          ],
          truncated: false,
        },
      },
    });

    renderPage();

    expect(await screen.findByRole('heading', { name: 'Acme Redesign' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /percent of tasks shipped/i })).toHaveAttribute('aria-valuenow', '33');
    expect(screen.getByText('1 of 3 shipped')).toBeInTheDocument();

    // A past-due, unfinished task is surfaced as Overdue, in its own section.
    const overdue = screen.getByRole('region', { name: 'Overdue' });
    expect(overdue).toHaveTextContent('Write copy');
    expect(screen.getByRole('region', { name: 'In flight' })).toHaveTextContent('Build API');
    expect(screen.getByRole('region', { name: 'Shipped' })).toHaveTextContent('Design homepage');
    expect(getStatus).toHaveBeenCalledWith('abc123');
  });

  test('shows an unavailable message when the link is unknown, rotated or disabled', async () => {
    getStatus.mockRejectedValue({ response: { status: 404 } });

    renderPage();

    expect(await screen.findByRole('heading', { name: /status page unavailable/i })).toBeInTheDocument();
  });

  test('keeps showing the last good page if a later refresh fails for a non-404 reason', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    getStatus
      .mockResolvedValueOnce({
        data: {
          status: {
            workspace: { name: 'Acme', icon: '🚀' },
            summary: { todo: 0, in_progress: 0, done: 1, total: 1, percent: 100 },
            tasks: [{ title: 'Ship it', status: 'done', dueDate: null, completedAt: PAST }],
            truncated: false,
          },
        },
      })
      .mockRejectedValue(new Error('network down'));

    renderPage();
    expect(await screen.findByRole('heading', { name: 'Acme' })).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(61 * 1000);

    expect(getStatus).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('heading', { name: 'Acme' })).toBeInTheDocument();
  });
});
