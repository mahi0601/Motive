import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TermsGate from './TermsGate';
import { acceptTerms } from '../../services/userService';

vi.mock('../../services/userService', () => ({ acceptTerms: vi.fn() }));
const refreshUser = vi.fn().mockResolvedValue(undefined);
const logout = vi.fn().mockResolvedValue(undefined);
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { name: 'Gina' }, refreshUser, logout }) }));

const renderGate = () => render(<MemoryRouter><TermsGate /></MemoryRouter>);

describe('TermsGate', () => {
  beforeEach(() => vi.clearAllMocks());

  test('explains why it is being asked and has an unchecked box with links that open in a new tab', () => {
    renderGate();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/one more step/i);
    const box = screen.getByRole('checkbox', { name: /16 or older and agree to the terms/i });
    expect(box).not.toBeChecked();
    const label = box.closest('label');
    const terms = within(label).getByRole('link', { name: /^terms$/i });
    expect(terms).toHaveAttribute('href', '/terms');
    expect(terms).toHaveAttribute('target', '_blank');
    expect(terms.getAttribute('rel')).toMatch(/noopener/);
    expect(within(label).getByRole('link', { name: /^privacy policy$/i })).toHaveAttribute('href', '/privacy');
  });

  test('continuing without ticking it says why and sends nothing', async () => {
    renderGate();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/16 or older/i);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true');
    expect(acceptTerms).not.toHaveBeenCalled();
  });

  test('ticked, it records the agreement once and then refreshes the profile, which lets the app through', async () => {
    acceptTerms.mockResolvedValue({ data: { user: { termsPending: false } } });
    renderGate();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    await waitFor(() => expect(acceptTerms).toHaveBeenCalledTimes(1));
    expect(acceptTerms).toHaveBeenCalledWith(true);
    await waitFor(() => expect(refreshUser).toHaveBeenCalled());
  });

  test('two quick clicks still send it once', async () => {
    let resolve;
    acceptTerms.mockReturnValue(new Promise((r) => { resolve = r; }));
    renderGate();
    fireEvent.click(screen.getByRole('checkbox'));
    const button = screen.getByRole('button', { name: /continue/i });
    act(() => {
      button.click();
      button.click();
    });
    expect(acceptTerms).toHaveBeenCalledTimes(1);
    resolve({ data: {} });
    await waitFor(() => expect(refreshUser).toHaveBeenCalled());
  });

  test('a refusal from the server is shown and can be retried', async () => {
    acceptTerms.mockRejectedValue({ response: { data: { message: 'Something went wrong' } } });
    renderGate();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled();
    expect(refreshUser).not.toHaveBeenCalled();
  });

  test('anyone who does not want to agree can sign out instead', () => {
    renderGate();
    fireEvent.click(screen.getByRole('button', { name: /log out/i }));
    expect(logout).toHaveBeenCalledTimes(1);
  });
});
