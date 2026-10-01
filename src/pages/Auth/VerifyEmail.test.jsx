import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import VerifyEmail from './VerifyEmail';
import { verifyEmail } from '../../services/authService';

vi.mock('../../services/authService', () => ({ verifyEmail: vi.fn() }));

const renderAt = (url) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Routes>
    </MemoryRouter>
  );

describe('VerifyEmail page', () => {
  beforeEach(() => vi.clearAllMocks());

  test('a valid link confirms the email, using the token exactly once', async () => {
    verifyEmail.mockResolvedValue({});
    renderAt('/verify-email?token=abc123');
    expect(await screen.findByText(/email confirmed/i)).toBeTruthy();
    expect(verifyEmail).toHaveBeenCalledTimes(1);
    expect(verifyEmail).toHaveBeenCalledWith('abc123');
  });

  test('a rejected token says the link is not valid', async () => {
    verifyEmail.mockRejectedValue({ response: { status: 400 } });
    renderAt('/verify-email?token=expired');
    expect(await screen.findByText(/link not valid/i)).toBeTruthy();
  });

  test('no token at all is not valid, and makes no request', async () => {
    renderAt('/verify-email');
    expect(await screen.findByText(/link not valid/i)).toBeTruthy();
    await waitFor(() => expect(verifyEmail).not.toHaveBeenCalled());
  });
});
