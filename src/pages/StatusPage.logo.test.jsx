import React from 'react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import StatusPage from './StatusPage';
import { getStatus, getStatusLogo } from '../services/statusService';

vi.mock('../services/statusService', () => ({ getStatus: vi.fn(), getStatusLogo: vi.fn(), sendFeedback: vi.fn() }));

const base = {
  workspace: { name: 'Acme Redesign', icon: '🚀' },
  summary: { todo: 0, in_progress: 0, done: 1, total: 1, percent: 100 },
  tasks: [{ title: 'Design homepage', status: 'done', dueDate: null, completedAt: '2026-01-01T00:00:00Z' }],
  truncated: false,
};
const PAGE = { headline: null, summary: null, milestone: null, accent: 'teal', hideBranding: false, allowFeedback: false };
const renderWith = (page) => {
  getStatus.mockResolvedValue({ data: { status: { ...base, page } } });
  return render(
    <MemoryRouter initialEntries={['/s/tok']}>
      <Routes>
        <Route path="/s/:token" element={<StatusPage />} />
      </Routes>
    </MemoryRouter>,
  );
};

describe('StatusPage: studio logo', () => {
  const created = [];
  beforeEach(() => {
    vi.clearAllMocks();
    created.length = 0;
    URL.createObjectURL = vi.fn((b) => {
      created.push(b);
      return 'blob:logo-1';
    });
    URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => vi.restoreAllMocks());

  test('with a logo, it replaces the icon, with the studio name as alt text', async () => {
    getStatusLogo.mockResolvedValue({ data: new Blob(['x'], { type: 'image/png' }) });
    renderWith({ ...PAGE, hasLogo: true, logoVersion: 5 });
    const img = await screen.findByRole('img', { name: 'Acme Redesign logo' });
    expect(img).toHaveAttribute('src', 'blob:logo-1');
    expect(screen.queryByText('🚀')).toBeNull();
    expect(getStatusLogo).toHaveBeenCalledWith('tok');
  });

  test('without a logo, nothing is fetched and the icon stays', async () => {
    renderWith({ ...PAGE, hasLogo: false });
    expect(await screen.findByText('🚀')).toBeInTheDocument();
    expect(getStatusLogo).not.toHaveBeenCalled();
    expect(screen.queryByRole('img', { name: /logo/i })).toBeNull();
  });

  test('an older server that sends no flag behaves like no logo', async () => {
    renderWith(PAGE);
    expect(await screen.findByText('🚀')).toBeInTheDocument();
    expect(getStatusLogo).not.toHaveBeenCalled();
  });

  test('if the logo cannot be loaded the page still shows its icon', async () => {
    getStatusLogo.mockRejectedValue(new Error('404'));
    renderWith({ ...PAGE, hasLogo: true, logoVersion: 1 });
    expect(await screen.findByText('🚀')).toBeInTheDocument();
    await waitFor(() => expect(getStatusLogo).toHaveBeenCalled());
    expect(screen.queryByRole('img', { name: /logo/i })).toBeNull();
  });

  test('anything that is not a PNG or JPEG is not shown', async () => {
    getStatusLogo.mockResolvedValue({ data: new Blob(['<svg/>'], { type: 'image/svg+xml' }) });
    renderWith({ ...PAGE, hasLogo: true, logoVersion: 1 });
    expect(await screen.findByText('🚀')).toBeInTheDocument();
    await waitFor(() => expect(getStatusLogo).toHaveBeenCalled());
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});
