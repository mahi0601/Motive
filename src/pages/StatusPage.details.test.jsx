import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
const renderWith = (page) => {
  getStatus.mockResolvedValue({ data: { status: page === undefined ? base : { ...base, page } } });
  return render(
    <MemoryRouter initialEntries={['/s/tok']}>
      <Routes>
        <Route path="/s/:token" element={<StatusPage />} />
      </Routes>
    </MemoryRouter>
  );
};
const PAGE = { headline: null, summary: null, milestone: null, accent: 'teal', hideBranding: false, allowFeedback: false };

describe('StatusPage: owner-written details', () => {
  beforeEach(() => vi.clearAllMocks());

  test('shows the headline, summary and next milestone the owner wrote', async () => {
    renderWith({ ...PAGE, headline: 'Website redesign for Acme', summary: 'Phase 2 of 3: build and review.', milestone: { title: 'Design sign-off', date: '2026-12-01T00:00:00.000Z' } });
    expect(await screen.findByText('Website redesign for Acme')).toBeInTheDocument();
    expect(screen.getByText('Phase 2 of 3: build and review.')).toBeInTheDocument();
    const milestone = screen.getByRole('region', { name: /next milestone/i });
    expect(milestone).toHaveTextContent('Design sign-off');
    expect(milestone).toHaveTextContent(/2026/);
  });

  test('falls back to "Project status" and shows no empty summary or milestone boxes', async () => {
    renderWith(PAGE);
    expect(await screen.findByText('Project status')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /next milestone/i })).toBeNull();
  });

  test('owner text is rendered as text, never as markup', async () => {
    const payload = '<img src=x onerror="window.__xss=1"><b>bold</b>';
    const { container } = renderWith({ ...PAGE, headline: payload, summary: payload });
    await screen.findAllByText(payload);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('b')).toBeNull();
    expect(window.__xss).toBeUndefined();
  });

  test('shows "Powered by Motive" unless the owner (on Pro) hid it', async () => {
    const { unmount } = renderWith(PAGE);
    expect(await screen.findByText(/powered by/i)).toBeInTheDocument();
    unmount();
    renderWith({ ...PAGE, hideBranding: true });
    await screen.findByText('Acme Redesign');
    expect(screen.queryByText(/powered by/i)).toBeNull();
  });

  test('applies the chosen accent to the progress bar', async () => {
    renderWith({ ...PAGE, accent: 'violet' });
    const bar = await screen.findByRole('progressbar', { name: /percent of tasks shipped/i });
    expect(bar.firstChild.className).toMatch(/--accent/);
    expect(bar.closest('[data-accent]').getAttribute('data-accent')).toBe('violet');
  });

  test('offers the response form only when the owner allowed it', async () => {
    const { unmount } = renderWith(PAGE);
    await screen.findByText('Acme Redesign');
    expect(screen.queryByRole('region', { name: /respond/i })).toBeNull();
    unmount();
    renderWith({ ...PAGE, allowFeedback: true, milestone: { title: 'Design sign-off', date: null } });
    const region = await screen.findByRole('region', { name: /respond/i });
    expect(region).toHaveTextContent(/send comment/i);
  });

  test('an older server that sends no `page` still renders the page', async () => {
    renderWith(undefined);
    expect(await screen.findByRole('heading', { name: 'Acme Redesign' })).toBeInTheDocument();
    expect(screen.getByText('Project status')).toBeInTheDocument();
  });
});
