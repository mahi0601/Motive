import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WeeklyEmailCard from './WeeklyEmailCard';
import { addSubscriber, listSubscribers, removeSubscriber, sendWeeklyEmailPreview, updateStatusPage } from '../../services/workspaceService';

vi.mock('../../services/workspaceService', () => ({
  addSubscriber: vi.fn(),
  listSubscribers: vi.fn(),
  removeSubscriber: vi.fn(),
  sendWeeklyEmailPreview: vi.fn(),
  updateStatusPage: vi.fn(),
}));
const loadWorkspace = vi.fn().mockResolvedValue(undefined);
let mockWorkspace;
vi.mock('../../context/WorkspaceContext', () => ({ useWorkspace: () => ({ workspace: mockWorkspace, loadWorkspace }) }));

const person = (over = {}) => ({ id: 's1', email: 'ann@client.example', name: null, unsubscribed: false, ...over });

describe('WeeklyEmailCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWorkspace = { id: 'ws-1', statusDigestEnabled: false, statusDigestDay: 1 };
    listSubscribers.mockResolvedValue({ data: { items: [person()], limit: 10 } });
  });

  test('lists who gets it with the plan limit, and the day picker only shows once it is on', async () => {
    render(<WeeklyEmailCard />);
    expect(await screen.findByText('ann@client.example')).toBeInTheDocument();
    expect(screen.getByText(/1 of 10/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/send on/i)).not.toBeInTheDocument();
  });

  test('the switch and the day save straight away and refresh the workspace', async () => {
    updateStatusPage.mockResolvedValue({ data: {} });
    mockWorkspace.statusDigestEnabled = true;
    render(<WeeklyEmailCard />);
    await screen.findByText('ann@client.example');
    fireEvent.change(screen.getByLabelText(/send on/i), { target: { value: '4' } });
    await waitFor(() => expect(updateStatusPage).toHaveBeenCalledWith('ws-1', { digestDay: 4 }));
    fireEvent.click(screen.getByLabelText(/email my client every week/i));
    await waitFor(() => expect(updateStatusPage).toHaveBeenCalledWith('ws-1', { digestEnabled: false }));
    expect(loadWorkspace).toHaveBeenCalled();
  });

  test('adds and removes an address', async () => {
    addSubscriber.mockResolvedValue({ data: { subscriber: person({ id: 's2' }) } });
    removeSubscriber.mockResolvedValue({ data: {} });
    render(<WeeklyEmailCard />);
    await screen.findByText('ann@client.example');
    fireEvent.change(screen.getByLabelText(/client email address/i), { target: { value: ' bob@client.example ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() => expect(addSubscriber).toHaveBeenCalledWith('ws-1', { email: 'bob@client.example' }));
    fireEvent.click(screen.getByRole('button', { name: /remove ann@client.example/i }));
    await waitFor(() => expect(removeSubscriber).toHaveBeenCalledWith('ws-1', 's1'));
  });

  test('shows the server message when the plan limit is hit, and stops adding when full', async () => {
    addSubscriber.mockRejectedValue({ response: { data: { message: 'Free includes 1 person per client for the weekly email.' } } });
    listSubscribers.mockResolvedValue({ data: { items: [], limit: 1 } });
    render(<WeeklyEmailCard />);
    await screen.findByText(/0 of 1/);
    fireEvent.change(screen.getByLabelText(/client email address/i), { target: { value: 'a@b.example' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Free includes 1 person');
  });

  test('marks an unsubscribed person and sends a preview to the owner', async () => {
    listSubscribers.mockResolvedValue({ data: { items: [person({ unsubscribed: true })], limit: 10 } });
    sendWeeklyEmailPreview.mockResolvedValue({ data: { sentTo: 'me@agency.example' } });
    render(<WeeklyEmailCard />);
    expect(await screen.findByText('unsubscribed')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /send me a preview/i }));
    expect(await screen.findByText('Preview sent to me@agency.example.')).toBeInTheDocument();
  });

  test('says so when the preview has nothing to show', async () => {
    sendWeeklyEmailPreview.mockRejectedValue({ response: { data: { message: 'Nothing finished or in progress yet, so there is nothing to send.' } } });
    render(<WeeklyEmailCard />);
    await screen.findByText('ann@client.example');
    fireEvent.click(screen.getByRole('button', { name: /send me a preview/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('nothing to send');
  });
});
