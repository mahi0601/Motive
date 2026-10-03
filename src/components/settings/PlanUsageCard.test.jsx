import React from 'react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PlanUsageCard from './PlanUsageCard';

let mockUser;
let mockCtx;
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: mockUser }) }));
vi.mock('../../context/WorkspaceContext', () => ({ useWorkspace: () => mockCtx }));

const LIVE = '2026-10-01T00:00:00.000Z';
const ws = (id, ownerId, live, members = 1) => ({ id, ownerId, shareEnabledAt: live ? LIVE : null, members: Array.from({ length: members }, (_, i) => ({ userId: `u${i}` })) });

describe('PlanUsageCard', () => {
  beforeEach(() => {
    mockUser = { id: 'me', isPro: false, tier: 'free' };
    const mine = ws('w1', 'me', false, 1);
    mockCtx = { workspace: mine, workspaces: [mine] };
  });

  test('shows the plan and what is used of it, with accessible meters', () => {
    render(<PlanUsageCard />);
    expect(screen.getByRole('heading', { name: /plan usage/i })).toBeInTheDocument();
    expect(screen.getByText(/you're on free/i)).toBeInTheDocument();
    const clients = screen.getByRole('progressbar', { name: /active client pages/i });
    expect(clients).toHaveAttribute('aria-valuenow', '0');
    expect(clients).toHaveAttribute('aria-valuemax', '1');
    expect(screen.getByText('0 of 1')).toBeInTheDocument();
    const members = screen.getByRole('progressbar', { name: /team members/i });
    expect(members).toHaveAttribute('aria-valuenow', '1');
    expect(members).toHaveAttribute('aria-valuemax', '2');
  });

  test('below the limits there is no upgrade pitch', () => {
    render(<PlanUsageCard />);
    expect(screen.queryByRole('link', { name: /see plans/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/at your plan's limit/i)).not.toBeInTheDocument();
  });

  test('at the client limit it says so and points at the next plan', () => {
    const live = ws('w1', 'me', true, 1);
    mockCtx = { workspace: live, workspaces: [live] };
    render(<PlanUsageCard />);
    expect(screen.getByText('1 of 1')).toBeInTheDocument();
    expect(screen.getByText(/at your plan's limit for active client pages/i)).toHaveTextContent(/studio/i);
    expect(screen.getByRole('link', { name: /see plans/i })).toHaveAttribute('href', '#billing');
  });

  test('at the team limit it says so', () => {
    const full = ws('w1', 'me', false, 2);
    mockCtx = { workspace: full, workspaces: [full] };
    render(<PlanUsageCard />);
    expect(screen.getByText(/at your plan's limit for team members/i)).toBeInTheDocument();
  });

  test('Studio counts against 10 clients and 5 members, and points at Agency', () => {
    mockUser = { id: 'me', isPro: true, tier: 'studio' };
    const list = Array.from({ length: 10 }, (_, i) => ws(`w${i}`, 'me', true, i === 0 ? 5 : 1));
    mockCtx = { workspace: list[0], workspaces: list };
    render(<PlanUsageCard />);
    expect(screen.getByText('10 of 10')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /team members/i })).toHaveAttribute('aria-valuemax', '5');
    expect(screen.getByText(/at your plan's limit for active client pages/i)).toHaveTextContent(/agency/i);
  });

  test('Agency has no client limit, no meter for it, and no upgrade pitch', () => {
    mockUser = { id: 'me', isPro: true, tier: 'agency' };
    const list = Array.from({ length: 12 }, (_, i) => ws(`w${i}`, 'me', true, 1));
    mockCtx = { workspace: list[0], workspaces: list };
    render(<PlanUsageCard />);
    expect(screen.getByText('12 (unlimited)')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar', { name: /active client pages/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /see plans/i })).not.toBeInTheDocument();
  });

  test('workspaces you only belong to do not count as your clients, and their team size is not yours to manage', () => {
    const theirs = ws('w9', 'someone-else', true, 2);
    const mine = ws('w1', 'me', true, 1);
    mockCtx = { workspace: theirs, workspaces: [mine, theirs] };
    render(<PlanUsageCard />);
    expect(screen.getByText('1 of 1')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar', { name: /team members/i })).not.toBeInTheDocument();
  });

  test('a profile saved before tiers existed counts a paid account as Agency', () => {
    mockUser = { id: 'me', isPro: true };
    render(<PlanUsageCard />);
    expect(screen.getByText(/you're on agency/i)).toBeInTheDocument();
  });

  test('renders nothing while signed out', () => {
    mockUser = null;
    const { container } = render(<PlanUsageCard />);
    expect(container).toBeEmptyDOMElement();
  });
});
