import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AccountCard from './AccountCard';
import { resendVerification } from '../../services/authService';
import { downloadMyData } from '../../services/userService';

vi.mock('../../services/authService', () => ({ resendVerification: vi.fn() }));
vi.mock('../../services/userService', () => ({ downloadMyData: vi.fn() }));
let mockUser;
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: mockUser }) }));

describe('AccountCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { email: 'me@example.com', emailVerifiedAt: null };
  });

  test('an unconfirmed account is told so and can ask for another email', async () => {
    resendVerification.mockResolvedValue({});
    render(<AccountCard />);
    expect(screen.getByText(/confirm me@example.com to invite teammates/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /resend confirmation email/i }));
    expect(await screen.findByText(/check your inbox/i)).toBeTruthy();
    expect(resendVerification).toHaveBeenCalledTimes(1);
  });

  test('a rate-limited resend says to wait, not "failed"', async () => {
    resendVerification.mockRejectedValue({ response: { status: 429 } });
    render(<AccountCard />);
    fireEvent.click(screen.getByRole('button', { name: /resend confirmation email/i }));
    expect(await screen.findByText(/try again in an hour/i)).toBeTruthy();
  });

  test('a confirmed account shows no resend button', () => {
    mockUser = { email: 'me@example.com', emailVerifiedAt: '2026-01-01T00:00:00Z' };
    render(<AccountCard />);
    expect(screen.getByText(/me@example.com is confirmed/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /resend/i })).toBeNull();
  });

  test('Download my data triggers the export, and a 429 explains the hourly limit', async () => {
    downloadMyData.mockResolvedValueOnce(undefined).mockRejectedValueOnce({ response: { status: 429 } });
    render(<AccountCard />);
    const button = screen.getByRole('button', { name: /download my data/i });
    fireEvent.click(button);
    await waitFor(() => expect(downloadMyData).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole('button', { name: /download my data/i }).disabled).toBe(false));
    fireEvent.click(screen.getByRole('button', { name: /download my data/i }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toMatch(/once an hour/i);
  });
});
