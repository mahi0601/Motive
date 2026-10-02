import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Register from './Register';
import { register } from '../../services/authService';

vi.mock('../../services/authService', () => ({ register: vi.fn() }));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ login: vi.fn() }) }));
vi.mock('../../components/ui/GoogleSignInButton', () => ({ default: () => <button type="button">Continue with Google</button> }));

const renderRegister = () => render(<MemoryRouter><Register /></MemoryRouter>);

const fill = () => {
  fireEvent.change(screen.getByPlaceholderText('Jane Doe'), { target: { value: 'Ada Lovelace' } });
  fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'ada@example.com' } });
  fireEvent.change(screen.getByPlaceholderText(/at least 8 characters/i), { target: { value: 'correct-horse-1' } });
};
const submit = () => fireEvent.click(screen.getByRole('button', { name: /create account/i }));

describe('Register: terms and age', () => {
  beforeEach(() => vi.clearAllMocks());

  test('has an unchecked checkbox about age, the Terms and the Privacy Policy, with links that open in a new tab', () => {
    renderRegister();
    const box = screen.getByRole('checkbox', { name: /16 or older and agree to the terms/i });
    expect(box).not.toBeChecked();
    const label = box.closest('label');
    const terms = within(label).getByRole('link', { name: /^terms$/i });
    expect(terms).toHaveAttribute('href', '/terms');
    expect(terms).toHaveAttribute('target', '_blank');
    expect(terms.getAttribute('rel')).toMatch(/noopener/);
    expect(within(label).getByRole('link', { name: /^privacy policy$/i })).toHaveAttribute('href', '/privacy');
  });

  test('submitting without ticking it shows why, and sends nothing', async () => {
    renderRegister();
    fill();
    submit();
    expect(await screen.findByText(/confirm you are 16 or older and agree to the terms/i)).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  test('the box is announced as invalid until it is ticked, and the error clears when it is', async () => {
    renderRegister();
    fill();
    submit();
    const box = screen.getByRole('checkbox');
    await waitFor(() => expect(box).toHaveAttribute('aria-invalid', 'true'));
    fireEvent.click(box);
    expect(box).toHaveAttribute('aria-invalid', 'false');
    expect(screen.queryByText(/confirm you are 16 or older/i)).not.toBeInTheDocument();
  });

  test('ticked, the sign-up sends acceptTerms: true with the details', async () => {
    register.mockResolvedValue({ data: { user: { id: 'u1' }, accessToken: 't' } });
    renderRegister();
    fill();
    fireEvent.click(screen.getByRole('checkbox'));
    submit();
    await waitFor(() => expect(register).toHaveBeenCalledTimes(1));
    expect(register).toHaveBeenCalledWith({ name: 'Ada Lovelace', email: 'ada@example.com', password: 'correct-horse-1', acceptTerms: true });
  });

  test('the Google option carries a notice with the same links, since it has no checkbox', () => {
    renderRegister();
    const notice = screen.getByText((_, el) => el?.tagName === 'P' && /^By continuing with Google you agree to the Terms and Privacy Policy\.$/.test(el.textContent.replace(/\s+/g, ' ').trim()));
    expect(within(notice).getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms');
    expect(within(notice).getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy');
  });
});
