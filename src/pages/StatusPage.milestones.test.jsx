import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import StatusPage from './StatusPage';
import { getStatus } from '../services/statusService';

vi.mock('../services/statusService', () => ({ getStatus: vi.fn(), sendFeedback: vi.fn() }));

const base = {
  workspace: { name: 'Acme Redesign', icon: '🚀' },
  summary: { todo: 1, in_progress: 0, done: 1, total: 2, percent: 50 },
  tasks: [{ title: 'Design homepage', status: 'done', dueDate: null, completedAt: '2026-01-01T00:00:00Z' }],
  truncated: false,
};
const PAGE = { headline: null, summary: null, accent: 'teal', hideBranding: false, allowFeedback: false };
const renderWith = (page) => {
  getStatus.mockResolvedValue({ data: { status: { ...base, page: { ...PAGE, ...page } } } });
  return render(
    <MemoryRouter initialEntries={['/s/tok']}>
      <Routes>
        <Route path="/s/:token" element={<StatusPage />} />
      </Routes>
    </MemoryRouter>
  );
};

const MS = [
  { id: 'a', title: 'Design sign-off', date: '2026-12-01T00:00:00.000Z', approvedAt: '2026-10-12T09:30:00.000Z' },
  { id: 'b', title: 'Build complete', date: '2027-01-15T00:00:00.000Z', approvedAt: null },
  { id: 'c', title: 'Launch', date: null, approvedAt: null },
];

describe('StatusPage milestones', () => {
  beforeEach(() => vi.clearAllMocks());

  test('several milestones are a timeline, in order, with each one\'s dates and approval', async () => {
    renderWith({ milestones: MS, milestone: MS[0] });
    const region = await screen.findByRole('region', { name: /^milestones$/i });
    const items = within(region).getAllByRole('listitem');
    expect(items.map((li) => li.textContent)).toEqual([
      expect.stringContaining('Design sign-off'),
      expect.stringContaining('Build complete'),
      expect.stringContaining('Launch'),
    ]);
    expect(items[0]).toHaveTextContent(/approved on/i);
    expect(items[0]).toHaveTextContent(/2026/);
    expect(items[1]).toHaveTextContent(/2027/);
    expect(items[1]).not.toHaveTextContent(/approved/i);
    expect(items[2]).not.toHaveTextContent(/approved/i);
    expect(screen.queryByRole('region', { name: /next milestone/i })).toBeNull();
  });

  test('marks the first one not yet approved as next', async () => {
    renderWith({ milestones: MS });
    const region = await screen.findByRole('region', { name: /^milestones$/i });
    const items = within(region).getAllByRole('listitem');
    expect(within(items[0]).queryByText('Next')).toBeNull();
    expect(within(items[1]).getByText('Next')).toBeInTheDocument();
    expect(within(items[2]).queryByText('Next')).toBeNull();
  });

  test('when every milestone is approved, none is marked as next', async () => {
    renderWith({ milestones: MS.map((m) => ({ ...m, approvedAt: '2026-10-12T09:30:00.000Z' })) });
    const region = await screen.findByRole('region', { name: /^milestones$/i });
    expect(within(region).queryByText('Next')).toBeNull();
  });

  test('one milestone keeps the single "Next milestone" card, so nothing looks different for a simple project', async () => {
    renderWith({ milestones: [MS[1]], milestone: MS[1] });
    const region = await screen.findByRole('region', { name: /next milestone/i });
    expect(region).toHaveTextContent('Build complete');
    expect(within(region).queryByRole('list')).toBeNull();
  });

  test('a server that predates the list (only `milestone`) still shows it', async () => {
    renderWith({ milestone: { title: 'Design sign-off', date: null, approvedAt: null } });
    expect(await screen.findByRole('region', { name: /next milestone/i })).toHaveTextContent('Design sign-off');
  });

  test('no milestones means no milestone section at all', async () => {
    renderWith({ milestones: [], milestone: null });
    await screen.findByText('Acme Redesign');
    expect(screen.queryByRole('region', { name: /milestone/i })).toBeNull();
  });

  test('milestone titles are text, never markup', async () => {
    renderWith({ milestones: [{ id: 'x', title: '<img src=x onerror=alert(1)>', date: null, approvedAt: null }, MS[1]] });
    const region = await screen.findByRole('region', { name: /^milestones$/i });
    expect(region).toHaveTextContent('<img src=x onerror=alert(1)>');
    expect(region.querySelector('img')).toBeNull();
  });

  test('the response form is given the milestones, so a client can approve a particular one', async () => {
    renderWith({ milestones: MS, allowFeedback: true });
    const respond = await screen.findByRole('region', { name: /respond/i });
    expect(within(respond).getByLabelText(/milestone/i)).toBeInTheDocument();
    expect(within(respond).getByRole('button', { name: /approve "build complete"/i })).toBeInTheDocument();
  });
});
