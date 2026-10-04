import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MembersCard from './MembersCard';

vi.mock('../../services/workspaceService', () => ({
  createInvite: vi.fn(),
  listInvites: vi.fn().mockResolvedValue({ data: { invites: [] } }),
  resendInvite: vi.fn(),
  revokeInvite: vi.fn(),
  updateMemberRole: vi.fn(),
  removeMember: vi.fn(),
  transferOwnership: vi.fn(),
  leaveWorkspace: vi.fn(),
  createWorkspace: vi.fn(),
}));

let mockUser;
let mockWorkspace;
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: mockUser }) }));
vi.mock('../../context/WorkspaceContext', () => ({
  useWorkspace: () => ({ workspace: mockWorkspace, loadWorkspace: vi.fn(), switchWorkspace: vi.fn() }),
}));

const members = (n) =>
  Array.from({ length: n }, (_, i) => ({ userId: `u${i}`, role: i === 0 ? 'owner' : 'editor', user: { id: `u${i}`, name: `Member ${i}`, email: `m${i}@example.invalid` } }));

describe('MembersCard team-size limit follows the plan', () => {
  beforeEach(() => {
    mockWorkspace = { id: 'ws', name: 'Acme', ownerId: 'u0', members: members(2) };
  });

  test('Free: at 2 members the invite form is replaced by an upgrade note naming Studio', () => {
    mockUser = { id: 'u0', isPro: false, tier: 'free' };
    render(<MembersCard />);
    expect(screen.getByText(/limited to 2 members/i)).toHaveTextContent(/studio/i);
    expect(screen.queryByPlaceholderText('teammate@example.com')).not.toBeInTheDocument();
  });

  test('Studio: 2 members is nowhere near the limit, so inviting is open', () => {
    mockUser = { id: 'u0', isPro: true, tier: 'studio' };
    render(<MembersCard />);
    expect(screen.getByPlaceholderText('teammate@example.com')).toBeInTheDocument();
  });

  test('Studio: at 5 members it is full, and the note points at Agency', () => {
    mockUser = { id: 'u0', isPro: true, tier: 'studio' };
    mockWorkspace = { ...mockWorkspace, members: members(5) };
    render(<MembersCard />);
    expect(screen.getByText(/limited to 5 members/i)).toHaveTextContent(/agency/i);
  });

  test('Agency: at 15 members it is full, with no upgrade pitch', () => {
    mockUser = { id: 'u0', isPro: true, tier: 'agency' };
    mockWorkspace = { ...mockWorkspace, members: members(15) };
    render(<MembersCard />);
    const note = screen.getByText(/limited to 15 members/i);
    expect(note).not.toHaveTextContent(/upgrade/i);
  });

  test('a profile saved before tiers existed counts a paid account as Agency', () => {
    mockUser = { id: 'u0', isPro: true };
    mockWorkspace = { ...mockWorkspace, members: members(6) };
    render(<MembersCard />);
    expect(screen.getByPlaceholderText('teammate@example.com')).toBeInTheDocument();
  });
});
