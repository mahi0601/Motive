import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NotificationsCard from './NotificationsCard';
import { updateProfile } from '../../services/userService';

vi.mock('../../services/userService', () => ({ updateProfile: vi.fn() }));
const refreshUser = vi.fn().mockResolvedValue(undefined);
let mockUser;
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: mockUser, refreshUser }) }));

describe('NotificationsCard: client response emails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: 'u1' };
  });

  test('is on for an account with no saved value, and turning it off is saved', async () => {
    updateProfile.mockResolvedValue({ data: {} });
    render(<NotificationsCard />);
    const box = screen.getByLabelText(/email me when a client responds/i);
    expect(box).toBeChecked();
    fireEvent.click(box);
    await waitFor(() => expect(updateProfile).toHaveBeenCalledWith({ notifyClientResponsesByEmail: false }));
    expect(refreshUser).toHaveBeenCalled();
  });

  test('shows the saved off state, and a failed save says so', async () => {
    mockUser = { id: 'u1', notifyClientResponsesByEmail: false };
    updateProfile.mockRejectedValue(new Error('no'));
    render(<NotificationsCard />);
    const box = screen.getByLabelText(/email me when a client responds/i);
    expect(box).not.toBeChecked();
    fireEvent.click(box);
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not save/i);
  });
});
