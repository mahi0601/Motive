import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import ClientFeedbackList from './ClientFeedbackList';
import { listFeedback, markFeedbackRead, deleteFeedback } from '../../services/workspaceService';

vi.mock('../../services/workspaceService', () => ({ listFeedback: vi.fn(), markFeedbackRead: vi.fn(), deleteFeedback: vi.fn() }));

const ITEMS = [
  { id: 'f2', kind: 'changes', authorName: 'Bo', message: 'Make it blue', milestoneTitle: 'Design sign-off', readAt: null, createdAt: '2026-10-02T10:00:00Z' },
  { id: 'f1', kind: 'approve', authorName: 'Ann', message: '', milestoneTitle: null, readAt: '2026-10-01T10:00:00Z', createdAt: '2026-10-01T09:00:00Z' },
];
const load = (items = ITEMS, unread = 1) => listFeedback.mockResolvedValue({ data: { items, unread, pagination: { total: items.length } } });

describe('ClientFeedbackList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    load();
  });

  test('lists what clients sent, with unread ones marked and an unread count', async () => {
    render(<ClientFeedbackList workspaceId="ws-1" />);
    expect(await screen.findByText('Make it blue')).toBeInTheDocument();
    expect(listFeedback).toHaveBeenCalledWith('ws-1');
    expect(screen.getByText(/1 unread/i)).toBeInTheDocument();
    const bo = screen.getByRole('listitem', { name: /bo/i });
    expect(within(bo).getByText(/requested changes/i)).toBeInTheDocument();
    expect(within(bo).getByText(/design sign-off/i)).toBeInTheDocument();
    expect(within(screen.getByRole('listitem', { name: /ann/i })).getByText(/approved/i)).toBeInTheDocument();
  });

  test('says plainly that names are not verified', async () => {
    render(<ClientFeedbackList workspaceId="ws-1" />);
    await screen.findByText('Make it blue');
    expect(screen.getByText(/names are typed by the sender and not verified/i)).toBeInTheDocument();
  });

  test('marking one read updates it and the count', async () => {
    markFeedbackRead.mockResolvedValue({});
    render(<ClientFeedbackList workspaceId="ws-1" />);
    await screen.findByText('Make it blue');
    fireEvent.click(screen.getByRole('button', { name: /mark bo.s feedback as read/i }));
    await waitFor(() => expect(markFeedbackRead).toHaveBeenCalledWith('ws-1', 'f2'));
    await waitFor(() => expect(screen.getByText(/0 unread/i)).toBeInTheDocument());
  });

  test('deleting asks nothing twice but removes the row once the server agrees', async () => {
    deleteFeedback.mockResolvedValue({});
    render(<ClientFeedbackList workspaceId="ws-1" />);
    await screen.findByText('Make it blue');
    fireEvent.click(screen.getByRole('button', { name: /delete bo.s feedback/i }));
    await waitFor(() => expect(deleteFeedback).toHaveBeenCalledWith('ws-1', 'f2'));
    await waitFor(() => expect(screen.queryByText('Make it blue')).toBeNull());
  });

  test('shows a helpful empty state', async () => {
    load([], 0);
    render(<ClientFeedbackList workspaceId="ws-1" />);
    expect(await screen.findByText(/nothing yet/i)).toBeInTheDocument();
  });

  test('a failed load says so instead of showing an empty list', async () => {
    listFeedback.mockRejectedValue(new Error('down'));
    render(<ClientFeedbackList workspaceId="ws-1" />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load/i);
  });
});
