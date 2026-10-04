import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StatusPageCard from './StatusPageCard';
import { enableShare, disableShare } from '../../services/workspaceService';

vi.mock('../../services/workspaceService', () => ({
  enableShare: vi.fn(),
  disableShare: vi.fn(),
  updateStatusPage: vi.fn(),
  listFeedback: vi.fn().mockResolvedValue({ data: { items: [], unread: 0, pagination: { total: 0 } } }),
  markFeedbackRead: vi.fn(),
  deleteFeedback: vi.fn(),
}));

const loadWorkspace = vi.fn().mockResolvedValue(undefined);
let mockWorkspace;
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'owner-1' } }) }));
vi.mock('../../context/WorkspaceContext', () => ({
  useWorkspace: () => ({ workspace: mockWorkspace, loadWorkspace }),
}));

describe('StatusPageCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWorkspace = { id: 'ws-1', name: 'Acme', ownerId: 'owner-1', shareEnabledAt: null };
  });

  test('renders nothing for a member who is not the owner', () => {
    mockWorkspace = { ...mockWorkspace, ownerId: 'someone-else' };
    const { container } = render(<StatusPageCard />);
    expect(container).toBeEmptyDOMElement();
  });

  test('warns that task titles become public before sharing is enabled', () => {
    render(<StatusPageCard />);
    expect(screen.getByText(/title, status and dates/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create status link/i })).toBeInTheDocument();
  });

  test('creating a link shows it once and refreshes the workspace', async () => {
    enableShare.mockResolvedValue({ data: { share: { token: 'abc123', shareEnabledAt: '2026-09-30T00:00:00Z' } } });
    render(<StatusPageCard />);

    fireEvent.click(screen.getByRole('button', { name: /create status link/i }));

    const field = await screen.findByLabelText('Status page link');
    expect(field.value).toBe(`${window.location.origin}/s/abc123`);
    expect(enableShare).toHaveBeenCalledWith('ws-1');
    expect(loadWorkspace).toHaveBeenCalled();
  });

  test('the new link has a Preview that opens it as a preview, so the owner\'s look is not counted as a client view', async () => {
    enableShare.mockResolvedValue({ data: { share: { token: 'abc123', shareEnabledAt: '2026-09-30T00:00:00Z' } } });
    render(<StatusPageCard />);
    fireEvent.click(screen.getByRole('button', { name: /create status link/i }));
    await screen.findByLabelText('Status page link');

    const preview = screen.getByRole('link', { name: /preview/i });
    expect(preview).toHaveAttribute('href', `${window.location.origin}/s/abc123?preview=1`);
    expect(preview).toHaveAttribute('target', '_blank');
    expect(preview.getAttribute('rel')).toMatch(/noopener/);
    // What gets copied and shared stays the plain link.
    expect(screen.getByLabelText('Status page link').value).toBe(`${window.location.origin}/s/abc123`);
  });

  test('a plan limit from the server is shown as the reason, not a generic failure', async () => {
    enableShare.mockRejectedValue({ response: { status: 402, data: { message: 'Free includes 1 active client page — upgrade to Clientglass Studio for more.' } } });
    render(<StatusPageCard />);
    fireEvent.click(screen.getByRole('button', { name: /create status link/i }));
    expect(await screen.findByText(/free includes 1 active client page/i)).toBeInTheDocument();
  });

  test('hitting the plan limit offers a way to the plans; other errors do not', async () => {
    enableShare.mockRejectedValueOnce({ response: { status: 402, data: { message: 'Free includes 1 active client page — upgrade to Clientglass Studio for more.' } } });
    const { unmount } = render(<StatusPageCard />);
    fireEvent.click(screen.getByRole('button', { name: /create status link/i }));
    expect(await screen.findByText(/free includes 1 active client page/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /see plans/i })).toHaveAttribute('href', '#billing');
    unmount();

    enableShare.mockRejectedValueOnce({ response: { status: 500, data: { message: 'Something broke' } } });
    render(<StatusPageCard />);
    fireEvent.click(screen.getByRole('button', { name: /create status link/i }));
    expect(await screen.findByText('Something broke')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /see plans/i })).not.toBeInTheDocument();
  });

  test('when sharing is already on, the old link is not shown — only a way to replace it', () => {
    mockWorkspace = { ...mockWorkspace, shareEnabledAt: '2026-09-29T00:00:00Z' };
    render(<StatusPageCard />);

    expect(screen.getByText(/sharing is on/i)).toBeInTheDocument();
    expect(screen.queryByLabelText('Status page link')).not.toBeInTheDocument();
    expect(screen.getByText(/can only be shown when it’s created/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /replace link/i })).toBeInTheDocument();
  });

  test('turning off needs a confirmation, then calls the API', async () => {
    mockWorkspace = { ...mockWorkspace, shareEnabledAt: '2026-09-29T00:00:00Z' };
    disableShare.mockResolvedValue({});
    render(<StatusPageCard />);

    fireEvent.click(screen.getByRole('button', { name: /^turn off$/i }));
    expect(disableShare).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /^turn off$/i })); // the confirm button
    await waitFor(() => expect(disableShare).toHaveBeenCalledWith('ws-1'));
  });

  test('shows the server error when creating fails', async () => {
    enableShare.mockRejectedValue({ response: { data: { message: 'Only the workspace owner can do that' } } });
    render(<StatusPageCard />);

    fireEvent.click(screen.getByRole('button', { name: /create status link/i }));

    expect(await screen.findByText('Only the workspace owner can do that')).toBeInTheDocument();
  });

  test('right after a link is created the owner is offered a way to send it, and not when the link is not shown', async () => {
    enableShare.mockResolvedValue({ data: { share: { token: 'abc123', shareEnabledAt: '2026-09-30T00:00:00Z' } } });
    render(<StatusPageCard />);
    expect(screen.queryByRole('region', { name: /send it to your client/i })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /create status link/i }));
    const panel = await screen.findByRole('region', { name: /send it to your client/i });
    expect(panel.querySelector('textarea').value).toContain(`${window.location.origin}/s/abc123`);
  });

  test('when sharing is already on and the link is not shown, there is nothing to send', () => {
    mockWorkspace = { ...mockWorkspace, shareEnabledAt: '2026-09-29T00:00:00Z' };
    render(<StatusPageCard />);
    expect(screen.queryByRole('region', { name: /send it to your client/i })).toBeNull();
  });
});
