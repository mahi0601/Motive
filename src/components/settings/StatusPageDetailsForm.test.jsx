import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StatusPageDetailsForm from './StatusPageDetailsForm';
import { updateStatusPage, saveMilestones } from '../../services/workspaceService';

vi.mock('../../services/workspaceService', () => ({ updateStatusPage: vi.fn(), saveMilestones: vi.fn() }));
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
    // The milestone fields are no longer part of this call: milestones are saved as a list.
    expect(updateStatusPage).toHaveBeenCalledWith('ws-1', {
      headline: 'New headline',
      summary: 'Going well.',
      accent: 'violet',
      hideBranding: false,
      allowFeedback: false,
      notifyViews: true,
    });
    expect(saveMilestones).not.toHaveBeenCalled(); // nothing about the milestones changed
    expect(loadWorkspace).toHaveBeenCalled();
    expect(await screen.findByRole('status')).toHaveTextContent(/saved/i);
  });

  test('shows how many characters are left', () => {
    render(<StatusPageDetailsForm />);
    fireEvent.change(screen.getByLabelText(/headline/i), { target: { value: 'x'.repeat(100) } });
    expect(screen.getByText('100 / 120')).toBeInTheDocument();
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

  describe('telling me when my client opens the page', () => {
    test('is on by default, with a plain explanation of how quiet it is', () => {
      render(<StatusPageDetailsForm />);
      expect(screen.getByRole('checkbox', { name: /tell me when my client opens the page/i })).toBeChecked();
      expect(screen.getByText(/at most one notice every 12 hours/i)).toBeInTheDocument();
    });

    test('follows what is saved, including an older workspace that has no value yet (on)', () => {
      mockWorkspace = { ...mockWorkspace, statusNotifyViews: false };
      const { unmount } = render(<StatusPageDetailsForm />);
      expect(screen.getByRole('checkbox', { name: /tell me when my client opens the page/i })).not.toBeChecked();
      unmount();
      const older = { ...mockWorkspace };
      delete older.statusNotifyViews; // a workspace saved before the setting existed
      mockWorkspace = older;
      render(<StatusPageDetailsForm />);
      expect(screen.getByRole('checkbox', { name: /tell me when my client opens the page/i })).toBeChecked();
    });

    test('switching it off is saved', async () => {
      updateStatusPage.mockResolvedValue({ data: { page: {} } });
      render(<StatusPageDetailsForm />);
      fireEvent.click(screen.getByRole('checkbox', { name: /tell me when my client opens the page/i }));
      fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
      await waitFor(() => expect(updateStatusPage).toHaveBeenCalled());
      expect(updateStatusPage.mock.calls[0][1].notifyViews).toBe(false);
    });
  });

  describe('milestones', () => {
    const LIST = [
      { id: 'm1', title: 'Design sign-off', date: '2026-12-01T00:00:00.000Z' },
      { id: 'm2', title: 'Build complete', date: '2027-01-15T00:00:00.000Z' },
      { id: 'm3', title: 'Launch', date: null },
    ];
    const withList = (list = LIST) => {
      mockWorkspace = { ...mockWorkspace, milestones: list };
    };
    const save = () => fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    const titles = () => screen.getAllByLabelText(/milestone( \d+)? name|next milestone name/i).map((i) => i.value);
    beforeEach(() => {
      updateStatusPage.mockResolvedValue({ data: { page: {} } });
      saveMilestones.mockImplementation(async (id, list) => ({ data: { milestones: list.map((m, i) => ({ id: m.id || `new${i}`, title: m.title, date: m.date })) } }));
    });

    test('shows each saved milestone in order, the first as the next one', () => {
      withList();
      render(<StatusPageDetailsForm />);
      expect(titles()).toEqual(['Design sign-off', 'Build complete', 'Launch']);
      expect(screen.getByLabelText(/next milestone name/i).value).toBe('Design sign-off');
      expect(screen.getByLabelText(/milestone 2 name/i).value).toBe('Build complete');
      expect(screen.getByLabelText(/milestone 3 date/i).value).toBe('');
      expect(screen.getByLabelText(/next milestone date/i).value).toBe('2026-12-01');
    });

    test('a workspace from a server that predates the list shows its single milestone', () => {
      render(<StatusPageDetailsForm />); // the default workspace only has milestoneTitle/Date
      expect(titles()).toEqual(['M1']);
    });

    test('with none saved there is one empty row to type into', () => {
      withList([]);
      render(<StatusPageDetailsForm />);
      expect(titles()).toEqual(['']);
    });

    test('adding a milestone appends an empty row, and saving sends the list with the existing ids', async () => {
      withList();
      render(<StatusPageDetailsForm />);
      fireEvent.click(screen.getByRole('button', { name: /add milestone/i }));
      fireEvent.change(screen.getByLabelText(/milestone 4 name/i), { target: { value: 'Handover' } });
      fireEvent.change(screen.getByLabelText(/milestone 4 date/i), { target: { value: '2027-02-01' } });
      save();
      await waitFor(() => expect(saveMilestones).toHaveBeenCalledTimes(1));
      expect(saveMilestones).toHaveBeenCalledWith('ws-1', [
        { id: 'm1', title: 'Design sign-off', date: '2026-12-01' },
        { id: 'm2', title: 'Build complete', date: '2027-01-15' },
        { id: 'm3', title: 'Launch', date: null },
        { title: 'Handover', date: '2027-02-01' },
      ]);
      expect(await screen.findByRole('status')).toHaveTextContent(/saved/i);
    });

    test('removing a milestone renumbers the rest and leaves it out of what is saved', async () => {
      withList();
      render(<StatusPageDetailsForm />);
      fireEvent.click(screen.getByRole('button', { name: /remove milestone 1/i }));
      expect(titles()).toEqual(['Build complete', 'Launch']);
      expect(screen.getByLabelText(/next milestone name/i).value).toBe('Build complete');
      save();
      await waitFor(() => expect(saveMilestones).toHaveBeenCalled());
      expect(saveMilestones.mock.calls[0][1].map((m) => m.id)).toEqual(['m2', 'm3']);
    });

    test('moving a milestone up or down reorders it, keeping its id', async () => {
      withList();
      render(<StatusPageDetailsForm />);
      fireEvent.click(screen.getByRole('button', { name: /move milestone 3 up/i }));
      expect(titles()).toEqual(['Design sign-off', 'Launch', 'Build complete']);
      fireEvent.click(screen.getByRole('button', { name: /move milestone 1 down/i }));
      expect(titles()).toEqual(['Launch', 'Design sign-off', 'Build complete']);
      save();
      await waitFor(() => expect(saveMilestones).toHaveBeenCalled());
      expect(saveMilestones.mock.calls[0][1].map((m) => m.id)).toEqual(['m3', 'm1', 'm2']);
    });

    test('the first row cannot move up and the last cannot move down', () => {
      withList();
      render(<StatusPageDetailsForm />);
      expect(screen.getByRole('button', { name: /move milestone 1 up/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /move milestone 3 down/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /move milestone 2 up/i })).not.toBeDisabled();
    });

    test('adding stops at 12, and says so', () => {
      withList(Array.from({ length: 12 }, (_, i) => ({ id: `m${i}`, title: `M${i}`, date: null })));
      render(<StatusPageDetailsForm />);
      expect(screen.getByRole('button', { name: /add milestone/i })).toBeDisabled();
      expect(screen.getByText(/up to 12 milestones/i)).toBeInTheDocument();
    });

    test('removing the only milestone leaves one empty row, and saving sends an empty list', async () => {
      withList([LIST[0]]);
      render(<StatusPageDetailsForm />);
      fireEvent.click(screen.getByRole('button', { name: /remove milestone 1/i }));
      expect(titles()).toEqual(['']);
      save();
      await waitFor(() => expect(saveMilestones).toHaveBeenCalledWith('ws-1', []));
    });

    test('the spare empty row is not saved, and nothing is sent when the milestones did not change', async () => {
      withList();
      render(<StatusPageDetailsForm />);
      fireEvent.click(screen.getByRole('button', { name: /add milestone/i })); // left blank
      save();
      await waitFor(() => expect(updateStatusPage).toHaveBeenCalled());
      expect(saveMilestones).not.toHaveBeenCalled();
    });

    test('a date with no name is explained and nothing at all is sent', () => {
      withList();
      render(<StatusPageDetailsForm />);
      fireEvent.click(screen.getByRole('button', { name: /add milestone/i }));
      fireEvent.change(screen.getByLabelText(/milestone 4 date/i), { target: { value: '2027-02-01' } });
      save();
      expect(screen.getByRole('alert')).toHaveTextContent(/milestone 4/i);
      expect(updateStatusPage).not.toHaveBeenCalled();
      expect(saveMilestones).not.toHaveBeenCalled();
    });

    test('the page details are saved first; if the milestones are then refused, the reason is shown', async () => {
      withList();
      saveMilestones.mockRejectedValue({ response: { status: 422, data: { message: 'A status page can have up to 12 milestones.' } } });
      render(<StatusPageDetailsForm />);
      fireEvent.change(screen.getByLabelText(/milestone 2 name/i), { target: { value: 'Renamed' } });
      save();
      expect(await screen.findByRole('alert')).toHaveTextContent(/up to 12 milestones/);
      expect(updateStatusPage).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('status')).toBeNull();
    });

    test('after a save the rows keep the ids the server gave, so saving again does not recreate them (which would lose their sign-offs)', async () => {
      withList([]);
      render(<StatusPageDetailsForm />);
      fireEvent.change(screen.getByLabelText(/next milestone name/i), { target: { value: 'Design sign-off' } });
      save();
      await waitFor(() => expect(saveMilestones).toHaveBeenCalledTimes(1));
      expect(saveMilestones.mock.calls[0][1]).toEqual([{ title: 'Design sign-off', date: null }]);
      await screen.findByRole('status');

      fireEvent.change(screen.getByLabelText(/next milestone date/i), { target: { value: '2026-12-15' } });
      save();
      await waitFor(() => expect(saveMilestones).toHaveBeenCalledTimes(2));
      expect(saveMilestones.mock.calls[1][1]).toEqual([{ id: 'new0', title: 'Design sign-off', date: '2026-12-15' }]);
    });

    test('saving twice without changing the milestones sends them only once', async () => {
      withList([]);
      render(<StatusPageDetailsForm />);
      fireEvent.change(screen.getByLabelText(/next milestone name/i), { target: { value: 'Launch' } });
      save();
      await waitFor(() => expect(saveMilestones).toHaveBeenCalledTimes(1));
      await screen.findByRole('status');
      fireEvent.change(screen.getByLabelText(/headline/i), { target: { value: 'Something else' } });
      save();
      await waitFor(() => expect(updateStatusPage).toHaveBeenCalledTimes(2));
      expect(saveMilestones).toHaveBeenCalledTimes(1);
    });
  });
});
