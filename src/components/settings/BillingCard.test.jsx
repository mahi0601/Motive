import React from 'react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BillingCard from './BillingCard';
import { createCheckoutSession, createPortalSession, reconcileCheckoutSession } from '../../services/paymentService';

vi.mock('../../services/paymentService', () => ({
  createCheckoutSession: vi.fn(),
  createPortalSession: vi.fn(),
  reconcileCheckoutSession: vi.fn(),
}));

const refreshUser = vi.fn().mockResolvedValue(undefined);
let mockUser;
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, refreshUser }),
}));

const renderCard = (route = '/settings') =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <BillingCard />
    </MemoryRouter>
  );

const FUTURE = '2026-11-15T00:00:00.000Z';

describe('BillingCard', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', { configurable: true, value: { href: '' } });
  });
  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });

  test('a lifetime user sees no purchase or billing controls', () => {
    mockUser = { isPro: true, proLifetime: true };
    renderCard();
    expect(screen.getByText('Lifetime Pro')).toBeInTheDocument();
    expect(screen.getByText(/pro for life/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /subscribe/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /manage billing/i })).not.toBeInTheDocument();
  });

  test('a subscriber sees the renewal date and can open the billing portal', async () => {
    mockUser = { isPro: true, proLifetime: false, subscriptionStatus: 'active', proPeriodEnd: FUTURE };
    createPortalSession.mockResolvedValue({ data: { url: 'https://billing.stripe.test/p' } });
    renderCard();

    expect(screen.getByText(/renews on/i)).toHaveTextContent('2026');
    fireEvent.click(screen.getByRole('button', { name: /manage billing/i }));

    await waitFor(() => expect(window.location.href).toBe('https://billing.stripe.test/p'));
  });

  test('a cancelled-but-still-active subscriber is told when Pro ends', () => {
    mockUser = {
      isPro: true,
      proLifetime: false,
      subscriptionStatus: 'active',
      subscriptionCancelAtPeriodEnd: true,
      proPeriodEnd: FUTURE,
    };
    renderCard();
    expect(screen.getByText(/subscription is cancelled/i)).toHaveTextContent('Pro stays on until');
    expect(screen.queryByText(/renews on/i)).not.toBeInTheDocument();
  });

  test('a failed payment shows a warning while keeping Pro', () => {
    mockUser = { isPro: true, proLifetime: false, subscriptionStatus: 'past_due', proPeriodEnd: FUTURE };
    renderCard();
    expect(screen.getByText(/last payment didn't go through/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /manage billing/i })).toBeInTheDocument();
  });

  test('shows a portal error instead of redirecting when it fails', async () => {
    mockUser = { isPro: true, proLifetime: false, subscriptionStatus: 'active', proPeriodEnd: FUTURE };
    createPortalSession.mockRejectedValue({ response: { data: { message: 'There is no billing account to manage' } } });
    renderCard();

    fireEvent.click(screen.getByRole('button', { name: /manage billing/i }));

    expect(await screen.findByText('There is no billing account to manage')).toBeInTheDocument();
    expect(window.location.href).toBe('');
  });

  test('a free user sees monthly pricing, no UPI promise, and subscribes in the chosen currency', async () => {
    mockUser = { isPro: false };
    createCheckoutSession.mockResolvedValue({ data: { url: 'https://checkout.stripe.test/s' } });
    renderCard();

    expect(screen.getByText(/monthly subscription/i)).toBeInTheDocument();
    expect(screen.getByText('$9.99 USD / month')).toBeInTheDocument();
    expect(screen.queryByText(/upi/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/one-time/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('₹799 INR / month'));
    fireEvent.click(screen.getByRole('button', { name: /subscribe to pro/i }));

    await waitFor(() => expect(createCheckoutSession).toHaveBeenCalledWith('inr'));
    expect(window.location.href).toBe('https://checkout.stripe.test/s');
  });

  test('returning from checkout reconciles the session and refreshes the profile', async () => {
    mockUser = { isPro: false };
    reconcileCheckoutSession.mockResolvedValue({});
    renderCard('/settings?upgrade=success&session_id=cs_test_1');

    await waitFor(() => expect(reconcileCheckoutSession).toHaveBeenCalledWith('cs_test_1'));
    await waitFor(() => expect(refreshUser).toHaveBeenCalled());
  });

  test('returning from the billing portal refreshes the profile', async () => {
    mockUser = { isPro: true, proLifetime: false, subscriptionStatus: 'active', proPeriodEnd: FUTURE };
    renderCard('/settings?billing=updated');
    await waitFor(() => expect(refreshUser).toHaveBeenCalled());
  });
});
