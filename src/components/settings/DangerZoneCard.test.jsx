import React from 'react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DangerZoneCard from './DangerZoneCard';
import { deleteAccount, getProfile } from '../../services/userService';

vi.mock('../../services/userService', () => ({ deleteAccount: vi.fn(), getProfile: vi.fn() }));
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { email: 'me@example.com' } }),
}));

const openConfirm = async () => {
  fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
  return screen.findByPlaceholderText(/your (password|account email)/i);
};

describe('DangerZoneCard', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', { configurable: true, value: { assign: vi.fn() } });
  });
  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });

  test('a password account confirms with its password', async () => {
    getProfile.mockResolvedValue({ data: { user: { hasPassword: true } } });
    deleteAccount.mockResolvedValue({});
    render(<DangerZoneCard />);

    const input = await openConfirm();
    expect(input).toHaveAttribute('type', 'password');
    fireEvent.change(input, { target: { value: 'hunter2hunter2' } });
    fireEvent.click(screen.getByRole('button', { name: /permanently delete/i }));

    await waitFor(() => expect(deleteAccount).toHaveBeenCalledWith({ password: 'hunter2hunter2' }));
    expect(window.location.assign).toHaveBeenCalledWith('/');
  });

  test('a Google-only account confirms by typing its email', async () => {
    getProfile.mockResolvedValue({ data: { user: { hasPassword: false } } });
    deleteAccount.mockResolvedValue({});
    render(<DangerZoneCard />);

    await waitFor(() => expect(getProfile).toHaveBeenCalled());
    const input = await screen.findByRole('button', { name: /delete account/i }).then(async () => {
      fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
      return screen.findByPlaceholderText(/your account email/i);
    });
    expect(input).toHaveAttribute('type', 'email');
    expect(screen.getByText('me@example.com')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: ' me@example.com ' } });
    fireEvent.click(screen.getByRole('button', { name: /permanently delete/i }));

    await waitFor(() => expect(deleteAccount).toHaveBeenCalledWith({ confirmEmail: 'me@example.com' }));
  });

  test('refuses to submit an empty confirmation and shows the server error on failure', async () => {
    getProfile.mockResolvedValue({ data: { user: { hasPassword: true } } });
    deleteAccount.mockRejectedValue({ response: { data: { message: 'Incorrect password' } } });
    render(<DangerZoneCard />);

    const input = await openConfirm();
    fireEvent.click(screen.getByRole('button', { name: /permanently delete/i }));
    // The same sentence is the instruction and (after a bad submit) the
    // validation error, so two matches means the error appeared.
    expect(await screen.findAllByText(/enter your password to confirm/i)).toHaveLength(2);
    expect(deleteAccount).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: 'wrongpassword1' } });
    fireEvent.click(screen.getByRole('button', { name: /permanently delete/i }));
    expect(await screen.findByText('Incorrect password')).toBeInTheDocument();
    expect(window.location.assign).not.toHaveBeenCalled();
  });
});
