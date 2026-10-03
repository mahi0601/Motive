import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MembersCard from './MembersCard';

vi.mock('../../services/workspaceService', () => ({
  createInvite: vi.fn(), listInvites: vi.fn().mockResolvedValue({ data: { invites: [] } }), resendInvite: vi.fn(), revokeInvite: vi.fn(),
  updateMemberRole: vi.fn(), removeMember: vi.fn(), transferOwnership: vi.fn(), leaveWorkspace: vi.fn(), createWorkspace: vi.fn(),
  duplicateWorkspace: vi.fn(),
}));
vi.mock('./DuplicateWorkspaceModal', () => ({ default: ({ onClose }) => <div role="dialog" aria-label="DUPLICATE MODAL"><button onClick={onClose}>close modal</button></div> }));

let mockUser;
let mockWorkspace;
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: mockUser }) }));
vi.mock('../../context/WorkspaceContext', () => ({ useWorkspace: () => ({ workspace: mockWorkspace, loadWorkspace: vi.fn(), switchWorkspace: vi.fn() }) }));
vi.mock('../../context/ToastContext', () => ({ useToast: () => ({ notify: vi.fn() }) }));

describe('MembersCard: new client from this one', () => {
  beforeEach(() => {
    mockUser = { id: 'u0', isPro: false, tier: 'free' };
    mockWorkspace = { id: 'ws', name: 'Acme', ownerId: 'u0', members: [{ userId: 'u0', role: 'owner', user: { id: 'u0', name: 'Owner', email: 'o@example.invalid' } }] };
  });

  test('the owner has the button, and it opens the dialog', () => {
    render(<MembersCard />);
    fireEvent.click(screen.getByRole('button', { name: /new client from this one/i }));
    expect(screen.getByRole('dialog', { name: 'DUPLICATE MODAL' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /close modal/i }));
    expect(screen.queryByRole('dialog', { name: 'DUPLICATE MODAL' })).toBeNull();
  });

  test('someone who is only a member of the workspace does not see it', () => {
    mockWorkspace = { ...mockWorkspace, ownerId: 'someone-else' };
    render(<MembersCard />);
    expect(screen.queryByRole('button', { name: /new client from this one/i })).toBeNull();
  });
});
