import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClientRequestInbox from './ClientRequestInbox';
import { listRequests, acceptRequest, declineRequest, updateRequest, deleteRequest } from '../../services/workspaceService';

vi.mock('../../services/workspaceService', () => ({
  listRequests: vi.fn(),
  acceptRequest: vi.fn(),
  declineRequest: vi.fn(),
  updateRequest: vi.fn(),
  deleteRequest: vi.fn(),
}));

const ITEMS = [
  { id: 'r2', title: 'Add a pricing page', details: 'Three tiers.', authorName: 'Bo', state: 'received', scope: null, readAt: null, createdAt: '2026-10-02T10:00:00Z' },
  { id: 'r1', title: 'Swap the footer photo', details: '', authorName: 'Ann', state: 'accepted', scope: 'in_scope', readAt: '2026-10-01T10:00:00Z', createdAt: '2026-10-01T09:00:00Z' },
];
const load = (items = ITEMS, unread = 1) => listRequests.mockResolvedValue({ data: { items, unread } });

describe('ClientRequestInbox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    load();
  });

  test('lists requests with the unread count and says names are not verified', async () => {
    render(<ClientRequestInbox workspaceId="ws-1" />);
    expect(await screen.findByText('Add a pricing page')).toBeInTheDocument();
    expect(screen.getByText(/1 unread/i)).toBeInTheDocument();
    expect(screen.getByText(/not verified/i)).toBeInTheDocument();
    expect(screen.getByText('Three tiers.')).toBeInTheDocument();
  });

  test('accepting as extra work calls the server and moves the row to "On your board"', async () => {
    acceptRequest.mockResolvedValue({ data: { task: { id: 't1' } } });
    render(<ClientRequestInbox workspaceId="ws-1" />);
    await screen.findByText('Add a pricing page');
    fireEvent.click(screen.getByRole('button', { name: /accept add a pricing page as extra work/i }));
    await waitFor(() => expect(acceptRequest).toHaveBeenCalledWith('ws-1', 'r2', { scope: 'extra' }));
    await waitFor(() => expect(screen.getByText(/0 unread/i)).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /accept add a pricing page as in scope/i })).not.toBeInTheDocument();
  });

  test('declining asks for an optional note and sends it', async () => {
    declineRequest.mockResolvedValue({ data: {} });
    render(<ClientRequestInbox workspaceId="ws-1" />);
    await screen.findByText('Add a pricing page');
    fireEvent.click(screen.getByRole('button', { name: /decline add a pricing page/i }));
    fireEvent.change(screen.getByLabelText(/note for your client/i), { target: { value: 'Next quarter.' } });
    fireEvent.click(screen.getByRole('button', { name: /confirm decline/i }));
    await waitFor(() => expect(declineRequest).toHaveBeenCalledWith('ws-1', 'r2', { note: 'Next quarter.' }));
    expect(await screen.findByText(/your note: next quarter/i)).toBeInTheDocument();
  });

  test('an accepted request can be re-tagged', async () => {
    updateRequest.mockResolvedValue({ data: {} });
    render(<ClientRequestInbox workspaceId="ws-1" />);
    await screen.findByText('Swap the footer photo');
    fireEvent.click(screen.getByRole('button', { name: /mark swap the footer photo as extra work/i }));
    await waitFor(() => expect(updateRequest).toHaveBeenCalledWith('ws-1', 'r1', { scope: 'extra' }));
  });

  test('a 409 says it was already decided and reloads', async () => {
    acceptRequest.mockRejectedValue({ response: { status: 409 } });
    render(<ClientRequestInbox workspaceId="ws-1" />);
    await screen.findByText('Add a pricing page');
    fireEvent.click(screen.getByRole('button', { name: /accept add a pricing page as in scope/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/already decided/i);
    await waitFor(() => expect(listRequests).toHaveBeenCalledTimes(2));
  });

  describe('the monthly allowance', () => {
    const withAllowance = (allowance) => listRequests.mockResolvedValue({ data: { items: ITEMS, unread: 1, allowance } });

    test('shows nothing when none is set', async () => {
      render(<ClientRequestInbox workspaceId="ws-1" />);
      await screen.findByText('Add a pricing page');
      expect(screen.queryByText(/this month/i)).not.toBeInTheDocument();
    });

    test('shows used of included, and extra work apart', async () => {
      withAllowance({ limit: 5, used: 3, extra: 1, resetsOn: '2026-11-01T00:00:00.000Z' });
      render(<ClientRequestInbox workspaceId="ws-1" />);
      expect(await screen.findByText(/3 of 5 included used, 1 extra work/i)).toBeInTheDocument();
      expect(screen.queryByText(/used the whole allowance/i)).not.toBeInTheDocument();
    });

    test('says you can still accept more once it is all used', async () => {
      withAllowance({ limit: 3, used: 3, extra: 0, resetsOn: '2026-11-01T00:00:00.000Z' });
      render(<ClientRequestInbox workspaceId="ws-1" />);
      expect(await screen.findByText(/you can still accept more/i)).toBeInTheDocument();
    });

    test('accepting asks the server for the new count', async () => {
      withAllowance({ limit: 5, used: 3, extra: 0, resetsOn: '2026-11-01T00:00:00.000Z' });
      acceptRequest.mockResolvedValue({ data: { task: { id: 't1' } } });
      render(<ClientRequestInbox workspaceId="ws-1" />);
      await screen.findByText(/3 of 5 included used/i);
      listRequests.mockResolvedValue({ data: { items: ITEMS, unread: 0, allowance: { limit: 5, used: 4, extra: 0, resetsOn: '2026-11-01T00:00:00.000Z' } } });
      fireEvent.click(screen.getByRole('button', { name: /accept add a pricing page as in scope/i }));
      expect(await screen.findByText(/4 of 5 included used/i)).toBeInTheDocument();
    });
  });

  test('deleting removes the row once the server agrees', async () => {
    deleteRequest.mockResolvedValue({});
    render(<ClientRequestInbox workspaceId="ws-1" />);
    await screen.findByText('Add a pricing page');
    fireEvent.click(screen.getByRole('button', { name: /delete add a pricing page/i }));
    await waitFor(() => expect(screen.queryByText('Add a pricing page')).not.toBeInTheDocument());
  });

  test('an empty inbox and a load failure both say so', async () => {
    load([], 0);
    const { unmount } = render(<ClientRequestInbox workspaceId="ws-1" />);
    expect(await screen.findByText(/nothing yet/i)).toBeInTheDocument();
    unmount();
    listRequests.mockRejectedValue({ response: { status: 500 } });
    render(<ClientRequestInbox workspaceId="ws-1" />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load/i);
  });
});
