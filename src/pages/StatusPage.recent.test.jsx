import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import StatusPage from './StatusPage';
import { getStatus } from '../services/statusService';

vi.mock('../services/statusService', () => ({ getStatus: vi.fn(), sendFeedback: vi.fn() }));

const base = {
  workspace: { name: 'Acme Redesign', icon: '🚀' },
  summary: { todo: 1, in_progress: 0, done: 2, total: 3, percent: 67 },
  tasks: [{ title: 'Design homepage', status: 'done', dueDate: null, completedAt: '2026-10-01T00:00:00Z' }],
  truncated: false,
  page: { headline: null, summary: null, milestones: [], milestone: null, accent: 'teal', hideBranding: false, allowFeedback: false },
};
const renderWith = (recent) => {
  getStatus.mockResolvedValue({ data: { status: { ...base, ...(recent === undefined ? {} : { recent }) } } });
  return render(
    <MemoryRouter initialEntries={['/s/tok']}>
      <Routes>
        <Route path="/s/:token" element={<StatusPage />} />
      </Routes>
    </MemoryRouter>
  );
};
const region = () => screen.findByRole('region', { name: /shipped this week/i });

describe('StatusPage: shipped this week', () => {
  beforeEach(() => vi.clearAllMocks());

  test('lists what shipped, newest first as sent, with the date, and the count', async () => {
    renderWith({ days: 7, count: 2, items: [{ title: 'Launch banner', completedAt: '2026-10-02T09:00:00Z' }, { title: 'Fix nav', completedAt: '2026-09-30T09:00:00Z' }] });
    const r = await region();
    expect(r).toHaveTextContent('2');
    const items = within(r).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Launch banner');
    expect(items[0]).toHaveTextContent(/2026/);
    expect(items[1]).toHaveTextContent('Fix nav');
  });

  test('says how many more there are when the list is only the newest few', async () => {
    renderWith({ days: 7, count: 13, items: Array.from({ length: 10 }, (_, i) => ({ title: `Win ${i}`, completedAt: '2026-10-02T09:00:00Z' })) });
    const r = await region();
    expect(within(r).getAllByRole('listitem')).toHaveLength(10);
    expect(r).toHaveTextContent(/and 3 more/i);
  });

  test('a single win reads naturally', async () => {
    renderWith({ days: 7, count: 1, items: [{ title: 'One thing', completedAt: '2026-10-02T09:00:00Z' }] });
    expect(await region()).toHaveTextContent(/1 task shipped/i);
  });

  test('is left out when nothing shipped', async () => {
    renderWith({ days: 7, count: 0, items: [] });
    await screen.findByText('Acme Redesign');
    expect(screen.queryByRole('region', { name: /shipped this week/i })).toBeNull();
  });

  test('is left out when an older server sends no `recent` at all', async () => {
    renderWith(undefined);
    await screen.findByText('Acme Redesign');
    expect(screen.queryByRole('region', { name: /shipped this week/i })).toBeNull();
  });

  test('titles are text, never markup', async () => {
    renderWith({ days: 7, count: 1, items: [{ title: '<img src=x onerror=alert(1)>', completedAt: '2026-10-02T09:00:00Z' }] });
    const r = await region();
    expect(r).toHaveTextContent('<img src=x onerror=alert(1)>');
    expect(r.querySelector('img')).toBeNull();
  });

  test('uses the same wording as the rest of the page when the window is not a week', async () => {
    renderWith({ days: 14, count: 1, items: [{ title: 'X', completedAt: '2026-10-02T09:00:00Z' }] });
    expect(await screen.findByRole('region', { name: /shipped in the last 14 days/i })).toBeInTheDocument();
  });

  describe('shipped each week', () => {
    const throughput = { weeks: 8, items: ['2026-08-17', '2026-08-24', '2026-08-31', '2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28', '2026-10-05'].map((start, i) => ({ start, count: [1, 2, 0, 3, 2, 4, 3, 2][i] })) };
    const renderThroughput = (t) => {
      getStatus.mockResolvedValue({ data: { status: { ...base, ...(t === undefined ? {} : { throughput: t }) } } });
      return render(
        <MemoryRouter initialEntries={['/s/tok']}>
          <Routes>
            <Route path="/s/:token" element={<StatusPage />} />
          </Routes>
        </MemoryRouter>
      );
    };

    test('shows the chart when the server sends the weekly counts', async () => {
      renderThroughput(throughput);
      expect(await screen.findByRole('region', { name: /shipped each week/i })).toHaveTextContent('17 tasks shipped in the last 8 weeks');
    });

    test('leaves it out for an older server that sends none, and when nothing shipped', async () => {
      const { unmount } = renderThroughput(undefined);
      await screen.findByText('Acme Redesign');
      expect(screen.queryByRole('region', { name: /shipped each week/i })).toBeNull();
      unmount();
      renderThroughput({ weeks: 8, items: throughput.items.map((w) => ({ ...w, count: 0 })) });
      await screen.findByText('Acme Redesign');
      expect(screen.queryByRole('region', { name: /shipped each week/i })).toBeNull();
    });
  });
});
