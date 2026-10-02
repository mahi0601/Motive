import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';
import { reportLandingFromStatus } from '../services/statusService';

vi.mock('../services/statusService', () => ({ reportLandingFromStatus: vi.fn().mockResolvedValue(undefined) }));

const renderHome = (url = '/') =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Home />
    </MemoryRouter>
  );

describe('Home pricing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  test('shows the three plans with prices in both currencies and what each includes', () => {
    renderHome();
    const pricing = screen.getByRole('region', { name: /pricing/i });
    for (const name of ['Free', 'Studio', 'Agency']) {
      expect(within(pricing).getByRole('heading', { name })).toBeInTheDocument();
    }
    expect(within(pricing).getByText('$19 / month')).toBeInTheDocument();
    expect(within(pricing).getByText('₹999 / month')).toBeInTheDocument();
    expect(within(pricing).getByText('$49 / month')).toBeInTheDocument();
    expect(within(pricing).getByText('₹2,499 / month')).toBeInTheDocument();
    expect(within(pricing).getByText('Unlimited active client pages')).toBeInTheDocument();
    expect(within(pricing).getByText('10 active client pages')).toBeInTheDocument();
  });

  test('says who pays for what: clients never need an account or a seat', () => {
    renderHome();
    const pricing = screen.getByRole('region', { name: /pricing/i });
    expect(within(pricing).getByText(/your clients never need an account or a seat/i)).toBeInTheDocument();
  });

  test('every plan leads to sign-up, and does not invent a free trial or discount', () => {
    renderHome();
    const pricing = screen.getByRole('region', { name: /pricing/i });
    const links = within(pricing).getAllByRole('link');
    expect(links).toHaveLength(3);
    for (const l of links) expect(l).toHaveAttribute('href', '/register');
    expect(pricing).not.toHaveTextContent(/trial|discount|save \d|% off/i);
  });
});

describe('Home landing report', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  test('a visit from a status page footer (?ref=status) is reported once', () => {
    renderHome('/?ref=status');
    expect(reportLandingFromStatus).toHaveBeenCalledTimes(1);
  });

  test('a reload or re-render in the same session is not counted twice', () => {
    renderHome('/?ref=status');
    cleanup();
    renderHome('/?ref=status');
    expect(reportLandingFromStatus).toHaveBeenCalledTimes(1);
  });

  test.each(['/', '/?ref=other', '/?ref=', '/?ref=STATUS'])('%s is not reported', (url) => {
    renderHome(url);
    expect(reportLandingFromStatus).not.toHaveBeenCalled();
  });

  test('a failed report never breaks the page', async () => {
    reportLandingFromStatus.mockRejectedValueOnce(new Error('offline'));
    renderHome('/?ref=status');
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
