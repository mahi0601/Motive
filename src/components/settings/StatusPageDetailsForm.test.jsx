import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StatusPageDetailsForm from './StatusPageDetailsForm';
import { updateStatusPage } from '../../services/workspaceService';

vi.mock('../../services/workspaceService', () => ({ updateStatusPage: vi.fn() }));
const loadWorkspace = vi.fn().mockResolvedValue(undefined);
let mockUser;
let mockWorkspace;
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: mockUser }) }));
vi.mock('../../context/WorkspaceContext', () => ({ useWorkspace: () => ({ workspace: mockWorkspace, loadWorkspace }) }));

describe('StatusPageDetailsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: 'o1', isPro: false };
    mockWorkspace = { id: 'ws-1', name: 'Acme', statusHeadline: 'Old headline', statusSummary: null, milestoneTitle: 'M1', milestoneDate: '2026-12-01T00:00:00.000Z', statusAccent: 'blue', statusHideBranding: false, statusAllowFeedback: false };
  });

  test('starts from what is saved, and warns that it is all public', () => {
    render(<StatusPageDetailsForm />);
    expect(screen.getByLabelText(/headline/i).value).toBe('Old headline');
    expect(screen.getByLabelText(/milestone name/i).value).toBe('M1');
    expect(screen.getByLabelText(/milestone date/i).value).toBe('2026-12-01');
    expect(screen.getByRole('radio', { name: /blue/i })).toBeChecked();
    expect(screen.getByText(/shown publicly/i)).toBeInTheDocument();
  });

  test('saves only what is in the form and refreshes the workspace', async () => {
    updateStatusPage.mockResolvedValue({ data: { page: {} } });
    render(<StatusPageDetailsForm />);
    fireEvent.change(screen.getByLabelText(/headline/i), { target: { value: 'New headline' } });
    fireEvent.change(screen.getByLabelText(/summary/i), { target: { value: 'Going well.' } });
    fireEvent.click(screen.getByRole('radio', { name: /violet/i }));
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(updateStatusPage).toHaveBeenCalledTimes(1));
    expect(updateStatusPage).toHaveBeenCalledWith('ws-1', {
      headline: 'New headline',
      summary: 'Going well.',
      milestoneTitle: 'M1',
      milestoneDate: '2026-12-01',
      accent: 'violet',
      hideBranding: false,
      allowFeedback: false,
    });
    expect(loadWorkspace).toHaveBeenCalled();
    expect(await screen.findByRole('status')).toHaveTextContent(/saved/i);
  });

  test('shows how many characters are left', () => {
    render(<StatusPageDetailsForm />);
    fireEvent.change(screen.getByLabelText(/headline/i), { target: { value: 'x'.repeat(100) } });
    expect(screen.getByText('100 / 120')).toBeInTheDocument();
  });

  test('clearing the milestone date sends null', async () => {
    updateStatusPage.mockResolvedValue({ data: { page: {} } });
    render(<StatusPageDetailsForm />);
    fireEvent.change(screen.getByLabelText(/milestone date/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(updateStatusPage).toHaveBeenCalled());
    expect(updateStatusPage.mock.calls[0][1].milestoneDate).toBeNull();
  });

  test('hiding "Powered by Clientglass" is disabled for a free account, with the reason', () => {
    render(<StatusPageDetailsForm />);
    const toggle = screen.getByRole('checkbox', { name: /hide .powered by clientglass./i });
    expect(toggle).toBeDisabled();
    expect(screen.getByText(/part of clientglass pro/i)).toBeInTheDocument();
  });

  test('a Pro account can turn it on and it is saved', async () => {
    mockUser = { id: 'o1', isPro: true };
    updateStatusPage.mockResolvedValue({ data: { page: {} } });
    render(<StatusPageDetailsForm />);
    const toggle = screen.getByRole('checkbox', { name: /hide .powered by clientglass./i });
    expect(toggle).not.toBeDisabled();
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(updateStatusPage).toHaveBeenCalled());
    expect(updateStatusPage.mock.calls[0][1].hideBranding).toBe(true);
  });

  test('lets the owner turn client responses on, with a plain warning about what that opens', async () => {
    updateStatusPage.mockResolvedValue({ data: { page: {} } });
    render(<StatusPageDetailsForm />);
    const toggle = screen.getByRole('checkbox', { name: /let clients respond/i });
    expect(toggle).not.toBeChecked();
    expect(screen.getByText(/anyone with the link can send/i)).toBeInTheDocument();
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(updateStatusPage).toHaveBeenCalled());
    expect(updateStatusPage.mock.calls[0][1].allowFeedback).toBe(true);
  });

  test('a server refusal is shown, not swallowed', async () => {
    updateStatusPage.mockRejectedValue({ response: { status: 422, data: { message: 'headline must be at most 120 characters' } } });
    render(<StatusPageDetailsForm />);
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/at most 120/);
  });
});
