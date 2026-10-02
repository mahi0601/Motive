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
    mockUser = { isPro: true, tier: 'agency', proLifetime: true };
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

  test('a free user sees both paid plans with every benefit, no UPI promise, and subscribes to the chosen plan in the chosen currency', async () => {
    mockUser = { isPro: false, tier: 'free' };
    createCheckoutSession.mockResolvedValue({ data: { url: 'https://checkout.stripe.test/s' } });
    renderCard();

    expect(screen.getByText(/monthly subscription/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Studio' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Agency' })).toBeInTheDocument();
    expect(screen.getByText('$19 / month')).toBeInTheDocument();
    expect(screen.getByText('$49 / month')).toBeInTheDocument();
    // Every real benefit is named, including the ones the old card left out.
    for (const line of [
      '10 active client pages',
      'Unlimited active client pages',
      'Up to 5 team members per workspace',
      'Up to 15 team members per workspace',
      '2 GB file storage',
      'Momentum month and quarter views',
    ]) {
      expect(screen.getAllByText(line).length).toBeGreaterThan(0);
    }
    expect(screen.getAllByText('Remove the “Powered by Clientglass” footer')).toHaveLength(2);
    expect(screen.queryByText(/upi/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/one-time/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'INR' }));
    expect(screen.getByText('₹999 / month')).toBeInTheDocument();
    expect(screen.getByText('₹2,499 / month')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /subscribe to agency/i }));

    await waitFor(() => expect(createCheckoutSession).toHaveBeenCalledWith('inr', 'agency'));
    expect(window.location.href).toBe('https://checkout.stripe.test/s');
  });

  test('subscribing to Studio in USD sends studio', async () => {
    mockUser = { isPro: false, tier: 'free' };
    createCheckoutSession.mockResolvedValue({ data: { url: 'https://checkout.stripe.test/s' } });
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: /subscribe to studio/i }));
    await waitFor(() => expect(createCheckoutSession).toHaveBeenCalledWith('usd', 'studio'));
  });

  test('a free user is told what their current plan includes', () => {
    mockUser = { isPro: false, tier: 'free' };
    renderCard();
    expect(screen.getByText(/you're on free/i)).toHaveTextContent('1 active client page');
  });

  test('a Studio subscriber sees their plan and is told how to move up', () => {
    mockUser = { isPro: true, tier: 'studio', proLifetime: false, subscriptionStatus: 'active', proPeriodEnd: FUTURE };
    renderCard();
    expect(screen.getByText('Studio plan')).toBeInTheDocument();
    expect(screen.getByText(/to move to agency/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /subscribe/i })).not.toBeInTheDocument();
  });

  test('an Agency subscriber sees their plan and no move-up hint', () => {
    mockUser = { isPro: true, tier: 'agency', proLifetime: false, subscriptionStatus: 'active', proPeriodEnd: FUTURE };
    renderCard();
    expect(screen.getByText('Agency plan')).toBeInTheDocument();
    expect(screen.queryByText(/to move to agency/i)).not.toBeInTheDocument();
  });

  test('a checkout error from the server is shown and nothing redirects', async () => {
    mockUser = { isPro: false, tier: 'free' };
    createCheckoutSession.mockRejectedValue({ response: { data: { message: 'Unsupported plan: x' } } });
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: /subscribe to studio/i }));
    expect(await screen.findByText('Unsupported plan: x')).toBeInTheDocument();
    expect(window.location.href).toBe('');
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
