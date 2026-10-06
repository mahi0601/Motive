import React from 'react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BillingCard from './BillingCard';
import {
  createCheckoutSession,
  createPortalSession,
  reconcileCheckoutSession,
  changePlan,
  getPaymentOptions,
  syncPayment,
  cancelSubscription,
} from '../../services/paymentService';

vi.mock('../../services/paymentService', () => ({
  createCheckoutSession: vi.fn(),
  createPortalSession: vi.fn(),
  reconcileCheckoutSession: vi.fn(),
  changePlan: vi.fn(),
  getPaymentOptions: vi.fn(),
  syncPayment: vi.fn(),
  cancelSubscription: vi.fn(),
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
const gw = (id, label, extra = {}) => ({ id, label, needsPhone: false, handoff: 'redirect', ...extra });
const STRIPE = gw('stripe', 'Stripe');
const RAZORPAY = gw('razorpay', 'Razorpay');
const PAYPAL = gw('paypal', 'PayPal');
const CASHFREE = gw('cashfree', 'Cashfree', { needsPhone: true, handoff: 'sdk' });
const withOptions = (options) => getPaymentOptions.mockResolvedValue({ data: { options } });

describe('BillingCard', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    // Most tests do not care which provider takes the money; both are available unless a test says not.
    getPaymentOptions.mockResolvedValue({ data: { options: { usd: [STRIPE], inr: [STRIPE] } } });
    syncPayment.mockResolvedValue({ data: { isPro: false } });
    try {
      localStorage.clear();
    } catch {
      // not available in this environment
    }
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
    expect(screen.queryByRole('button', { name: /switch to agency/i })).not.toBeInTheDocument();
  });

  test('a subscriber sees the renewal date and can open the billing portal', async () => {
    mockUser = { isPro: true, proLifetime: false, subscriptionStatus: 'active', proPeriodEnd: FUTURE };
    createPortalSession.mockResolvedValue({ data: { url: 'https://billing.stripe.com/p' } });
    renderCard();

    expect(screen.getByText(/renews on/i)).toHaveTextContent('2026');
    fireEvent.click(screen.getByRole('button', { name: /manage billing/i }));

    await waitFor(() => expect(window.location.href).toBe('https://billing.stripe.com/p'));
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
    createCheckoutSession.mockResolvedValue({ data: { url: 'https://checkout.stripe.com/s' } });
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

    await waitFor(() => expect(createCheckoutSession).toHaveBeenCalledWith('inr', 'agency', { provider: undefined, phone: undefined })); // options not loaded yet: the server picks
    expect(window.location.href).toBe('https://checkout.stripe.com/s');
  });

  test('subscribing to Studio in USD sends studio', async () => {
    mockUser = { isPro: false, tier: 'free' };
    createCheckoutSession.mockResolvedValue({ data: { url: 'https://checkout.stripe.com/s' } });
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: /subscribe to studio/i }));
    await waitFor(() => expect(createCheckoutSession).toHaveBeenCalledWith('usd', 'studio', { provider: undefined, phone: undefined }));
  });

  test('a free user is told what their current plan includes', () => {
    mockUser = { isPro: false, tier: 'free' };
    renderCard();
    expect(screen.getByText(/you're on free/i)).toHaveTextContent('1 active client page');
  });

  describe('switching from Studio to Agency', () => {
    const studio = (extra = {}) => ({ isPro: true, tier: 'studio', proLifetime: false, subscriptionStatus: 'active', proPeriodEnd: FUTURE, ...extra });

    test('a healthy Studio subscriber sees their plan and a Switch to Agency button, not a purchase button', () => {
      mockUser = studio();
      renderCard();
      expect(screen.getByText('Studio plan')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /switch to agency/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^subscribe/i })).not.toBeInTheDocument();
    });

    test('clicking it asks first, naming both prices and saying the change is prorated; nothing is charged yet', () => {
      mockUser = studio();
      renderCard();
      fireEvent.click(screen.getByRole('button', { name: /switch to agency/i }));
      const panel = screen.getByRole('group', { name: /confirm switch to agency/i });
      expect(panel).toHaveTextContent('$49');
      expect(panel).toHaveTextContent('₹2,499');
      expect(panel).toHaveTextContent(/prorated/i);
      expect(changePlan).not.toHaveBeenCalled();
    });

    test('Cancel closes the question without calling the server', () => {
      mockUser = studio();
      renderCard();
      fireEvent.click(screen.getByRole('button', { name: /switch to agency/i }));
      fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
      expect(screen.queryByRole('group', { name: /confirm switch to agency/i })).not.toBeInTheDocument();
      expect(changePlan).not.toHaveBeenCalled();
    });

    test('confirming switches the plan once, then refreshes the profile and says it worked', async () => {
      mockUser = studio();
      changePlan.mockResolvedValue({ data: { success: true, tier: 'agency' } });
      renderCard();
      fireEvent.click(screen.getByRole('button', { name: /switch to agency/i }));
      fireEvent.click(screen.getByRole('button', { name: /confirm switch/i }));

      await waitFor(() => expect(changePlan).toHaveBeenCalledWith('agency'));
      await waitFor(() => expect(refreshUser).toHaveBeenCalled());
      expect(changePlan).toHaveBeenCalledTimes(1);
      expect(await screen.findByText(/you're now on agency/i)).toBeInTheDocument();
    });

    test('the confirm button is disabled while the switch is in flight, so a double click cannot send it twice', async () => {
      mockUser = studio();
      let resolve;
      changePlan.mockReturnValue(new Promise((r) => { resolve = r; }));
      renderCard();
      fireEvent.click(screen.getByRole('button', { name: /switch to agency/i }));
      fireEvent.click(screen.getByRole('button', { name: /confirm switch/i }));
      expect(screen.getByRole('button', { name: /switching/i })).toBeDisabled();
      fireEvent.click(screen.getByRole('button', { name: /switching/i }));
      expect(changePlan).toHaveBeenCalledTimes(1);
      resolve({ data: { tier: 'agency' } });
      await waitFor(() => expect(refreshUser).toHaveBeenCalled());
    });

    test('a refusal from the server is shown as the reason and the plan is not reported as changed', async () => {
      mockUser = studio();
      changePlan.mockRejectedValue({ response: { data: { message: 'Could not change your plan, so nothing was changed. Try again, or contact support.' } } });
      renderCard();
      fireEvent.click(screen.getByRole('button', { name: /switch to agency/i }));
      fireEvent.click(screen.getByRole('button', { name: /confirm switch/i }));
      expect(await screen.findByText(/nothing was changed/i)).toBeInTheDocument();
      expect(screen.queryByText(/you're now on agency/i)).not.toBeInTheDocument();
      expect(refreshUser).not.toHaveBeenCalled();
    });

    test('with a failed payment the switch is replaced by what to fix first', () => {
      mockUser = studio({ subscriptionStatus: 'past_due' });
      renderCard();
      expect(screen.queryByRole('button', { name: /switch to agency/i })).not.toBeInTheDocument();
      expect(screen.getByText(/fix your payment to switch to agency/i)).toBeInTheDocument();
    });

    test('with a subscription set to end, the switch is replaced by how to resume it', () => {
      mockUser = studio({ subscriptionCancelAtPeriodEnd: true });
      renderCard();
      expect(screen.queryByRole('button', { name: /switch to agency/i })).not.toBeInTheDocument();
      expect(screen.getByText(/resume your subscription to switch to agency/i)).toBeInTheDocument();
    });
  });

  test('an Agency subscriber sees their plan and no move-up hint', () => {
    mockUser = { isPro: true, tier: 'agency', proLifetime: false, subscriptionStatus: 'active', proPeriodEnd: FUTURE };
    renderCard();
    expect(screen.getByText('Agency plan')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /switch to agency/i })).not.toBeInTheDocument();
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

  describe('which gateway takes the payment', () => {
    test('INR on Razorpay and USD on Stripe: the note names the gateway for the chosen currency', async () => {
      mockUser = { isPro: false };
      withOptions({ usd: [STRIPE], inr: [RAZORPAY] });
      renderCard();
      expect(await screen.findByText(/stripe's secure checkout/i)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'INR' }));
      expect(await screen.findByText(/razorpay's secure checkout/i)).toBeInTheDocument();
    });

    test('an unavailable currency says so up front and disables the buttons, instead of failing at the click', async () => {
      mockUser = { isPro: false };
      withOptions({ usd: [], inr: [RAZORPAY] });
      renderCard();
      expect(await screen.findByRole('alert')).toHaveTextContent(/payments in usd aren't available yet/i);
      expect(screen.getByRole('alert')).toHaveTextContent(/choose the other currency/i);
      expect(screen.getByRole('button', { name: /subscribe to studio/i })).toBeDisabled();
      fireEvent.click(screen.getByRole('button', { name: 'INR' }));
      await waitFor(() => expect(screen.getByRole('button', { name: /subscribe to studio/i })).toBeEnabled());
    });

    test('with no gateway at all it does not suggest another currency', async () => {
      mockUser = { isPro: false };
      withOptions({ usd: [], inr: [] });
      renderCard();
      expect(await screen.findByRole('alert')).not.toHaveTextContent(/other currency/i);
    });

    test('if the options cannot be read, checkout is still allowed and the server decides', async () => {
      mockUser = { isPro: false };
      getPaymentOptions.mockRejectedValue(new Error('offline'));
      renderCard();
      await waitFor(() => expect(getPaymentOptions).toHaveBeenCalled());
      expect(screen.getByRole('button', { name: /subscribe to studio/i })).toBeEnabled();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    });
  });

  describe('the "Pay with" picker', () => {
    test('is not shown when only one gateway takes the currency', async () => {
      mockUser = { isPro: false };
      withOptions({ usd: [STRIPE], inr: [RAZORPAY] });
      renderCard();
      await screen.findByText(/stripe's secure checkout/i);
      expect(screen.queryByRole('radiogroup', { name: /pay with/i })).not.toBeInTheDocument();
    });

    test('is shown with two or more, lists each by name and preselects the first', async () => {
      mockUser = { isPro: false };
      withOptions({ usd: [STRIPE, PAYPAL], inr: [RAZORPAY, CASHFREE, STRIPE] });
      renderCard();
      const group = await screen.findByRole('radiogroup', { name: /pay with/i });
      expect(group).toHaveTextContent('Stripe');
      expect(group).toHaveTextContent('PayPal');
      expect(screen.getByRole('radio', { name: 'Stripe' })).toBeChecked();
      expect(screen.getByRole('radio', { name: 'PayPal' })).not.toBeChecked();
    });

    test('changing currency shows that currency\'s gateways and preselects its first', async () => {
      mockUser = { isPro: false };
      withOptions({ usd: [STRIPE, PAYPAL], inr: [RAZORPAY, CASHFREE, STRIPE] });
      renderCard();
      await screen.findByRole('radiogroup', { name: /pay with/i });
      fireEvent.click(screen.getByRole('radio', { name: 'PayPal' }));
      fireEvent.click(screen.getByRole('button', { name: 'INR' }));
      expect(screen.getByRole('radio', { name: 'Razorpay' })).toBeChecked();
      expect(screen.queryByRole('radio', { name: 'PayPal' })).not.toBeInTheDocument();
    });

    test('the chosen gateway is what checkout is asked for, and the footer names it', async () => {
      mockUser = { isPro: false };
      withOptions({ usd: [STRIPE, PAYPAL], inr: [STRIPE] });
      createCheckoutSession.mockResolvedValue({ data: { provider: 'paypal', url: 'https://www.paypal.com/approve' } });
      renderCard();
      fireEvent.click(await screen.findByRole('radio', { name: 'PayPal' }));
      expect(screen.getByText(/pay on paypal's secure checkout/i)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /subscribe to studio/i }));
      await waitFor(() => expect(createCheckoutSession).toHaveBeenCalledWith('usd', 'studio', { provider: 'paypal', phone: undefined }));
      await waitFor(() => expect(window.location.href).toBe('https://www.paypal.com/approve'));
    });

    test('with no choice made, the first gateway is the one asked for', async () => {
      mockUser = { isPro: false };
      withOptions({ usd: [STRIPE, PAYPAL], inr: [STRIPE] });
      createCheckoutSession.mockResolvedValue({ data: { provider: 'stripe', url: 'https://checkout.stripe.com/x' } });
      renderCard();
      await screen.findByRole('radiogroup', { name: /pay with/i });
      fireEvent.click(screen.getByRole('button', { name: /subscribe to agency/i }));
      await waitFor(() => expect(createCheckoutSession).toHaveBeenCalledWith('usd', 'agency', { provider: 'stripe', phone: undefined }));
    });
  });

  describe('Cashfree: phone number and the SDK checkout', () => {
    const open = async () => {
      mockUser = { isPro: false };
      withOptions({ usd: [STRIPE], inr: [CASHFREE, RAZORPAY] });
      renderCard();
      fireEvent.click(await screen.findByRole('button', { name: 'INR' }));
      await screen.findByLabelText(/mobile number/i);
    };
    let originalCashfree;
    beforeEach(() => {
      originalCashfree = window.Cashfree;
    });
    afterEach(() => {
      window.Cashfree = originalCashfree;
      vi.restoreAllMocks();
    });

    test('the phone field appears only for a gateway that needs it, with a plain note that it is not kept', async () => {
      await open();
      expect(screen.getByText(/sent to cashfree only and is not saved/i)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('radio', { name: 'Razorpay' }));
      expect(screen.queryByLabelText(/mobile number/i)).not.toBeInTheDocument();
    });

    test.each([[''], ['12345'], ['5876543210'], ['abcdefghij']])('a phone of %p is refused here, without calling the server', async (value) => {
      await open();
      fireEvent.change(screen.getByLabelText(/mobile number/i), { target: { value } });
      fireEvent.click(screen.getByRole('button', { name: /subscribe to studio/i }));
      expect(await screen.findByText(/valid 10-digit indian mobile number/i)).toBeInTheDocument();
      expect(createCheckoutSession).not.toHaveBeenCalled();
    });

    test.each([['98765 43210'], ['+91 98765-43210'], ['09876543210']])('%s is accepted and sent with the choice', async (value) => {
      await open();
      window.Cashfree = vi.fn(() => ({ subscriptionsCheckout: vi.fn().mockResolvedValue(undefined) }));
      createCheckoutSession.mockResolvedValue({ data: { provider: 'cashfree', sessionId: 's1', mode: 'sandbox' } });
      fireEvent.change(screen.getByLabelText(/mobile number/i), { target: { value } });
      fireEvent.click(screen.getByRole('button', { name: /subscribe to studio/i }));
      await waitFor(() => expect(createCheckoutSession).toHaveBeenCalledWith('inr', 'studio', { provider: 'cashfree', phone: value }));
    });

    test('a session opens Cashfree\'s checkout in the same tab, in the mode the server named, and remembers to confirm on return', async () => {
      await open();
      const subscriptionsCheckout = vi.fn().mockResolvedValue(undefined);
      window.Cashfree = vi.fn(() => ({ subscriptionsCheckout }));
      createCheckoutSession.mockResolvedValue({ data: { provider: 'cashfree', sessionId: 'sess_9', mode: 'production' } });
      fireEvent.change(screen.getByLabelText(/mobile number/i), { target: { value: '9876543210' } });
      fireEvent.click(screen.getByRole('button', { name: /subscribe to studio/i }));
      await waitFor(() => expect(subscriptionsCheckout).toHaveBeenCalledWith({ subsSessionId: 'sess_9', redirectTarget: '_self' }));
      expect(window.Cashfree).toHaveBeenCalledWith({ mode: 'production' });
      expect(window.location.href).toBe(''); // no URL redirect: the SDK does the hand-off
      expect(Number(localStorage.getItem('cg-pending-payment'))).toBeGreaterThan(0);
    });

    test('anything but "production" is sandbox, so a mistyped mode can never be live', async () => {
      await open();
      window.Cashfree = vi.fn(() => ({ subscriptionsCheckout: vi.fn().mockResolvedValue(undefined) }));
      createCheckoutSession.mockResolvedValue({ data: { provider: 'cashfree', sessionId: 's', mode: 'prod' } });
      fireEvent.change(screen.getByLabelText(/mobile number/i), { target: { value: '9876543210' } });
      fireEvent.click(screen.getByRole('button', { name: /subscribe to studio/i }));
      await waitFor(() => expect(window.Cashfree).toHaveBeenCalledWith({ mode: 'sandbox' }));
    });

    test('if the script cannot load, the buyer gets a plain message, the button comes back and nothing is left pending', async () => {
      await open();
      window.Cashfree = undefined;
      vi.spyOn(document.head, 'appendChild').mockImplementation((el) => {
        setTimeout(() => el.onerror && el.onerror());
        return el;
      });
      createCheckoutSession.mockResolvedValue({ data: { provider: 'cashfree', sessionId: 's', mode: 'sandbox' } });
      fireEvent.change(screen.getByLabelText(/mobile number/i), { target: { value: '9876543210' } });
      fireEvent.click(screen.getByRole('button', { name: /subscribe to studio/i }));
      expect(await screen.findByText(/could not load the payment window/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /subscribe to studio/i })).toBeEnabled();
      expect(localStorage.getItem('cg-pending-payment')).toBeNull();
    });

    test('a server refusal (bad phone, gateway down) is shown and nothing is left pending', async () => {
      await open();
      createCheckoutSession.mockRejectedValue({ response: { data: { message: 'Enter a valid 10-digit Indian mobile number.' } } });
      fireEvent.change(screen.getByLabelText(/mobile number/i), { target: { value: '9876543210' } });
      fireEvent.click(screen.getByRole('button', { name: /subscribe to studio/i }));
      expect(await screen.findByText(/valid 10-digit indian mobile number/i)).toBeInTheDocument();
      expect(localStorage.getItem('cg-pending-payment')).toBeNull();
    });
  });

  describe('coming back from PayPal or Cashfree (?upgrade=pending)', () => {
    test('starts confirming the payment and clears the address', async () => {
      mockUser = { isPro: false };
      renderCard('/settings?upgrade=pending&gateway=paypal');
      expect(await screen.findByText(/confirming your payment/i)).toBeInTheDocument();
      await waitFor(() => expect(syncPayment).toHaveBeenCalled());
      expect(Number(localStorage.getItem('cg-pending-payment'))).toBeGreaterThan(0);
    });

    test('a redirect-style gateway other than Stripe remembers to confirm on return', async () => {
      mockUser = { isPro: false };
      withOptions({ usd: [PAYPAL], inr: [STRIPE] });
      createCheckoutSession.mockResolvedValue({ data: { provider: 'paypal', url: 'https://www.paypal.com/a' } });
      renderCard();
      fireEvent.click(await screen.findByRole('button', { name: /subscribe to studio/i }));
      await waitFor(() => expect(window.location.href).toBe('https://www.paypal.com/a'));
      expect(Number(localStorage.getItem('cg-pending-payment'))).toBeGreaterThan(0);
    });
  });

  describe('paying on Razorpay (no redirect back)', () => {
    test('going to Razorpay remembers to check for the payment on return', async () => {
      mockUser = { isPro: false };
      withOptions({ usd: [STRIPE], inr: [RAZORPAY] });
      createCheckoutSession.mockResolvedValue({ data: { url: 'https://rzp.io/i/abc', provider: 'razorpay' } });
      renderCard();
      fireEvent.click(await screen.findByRole('button', { name: 'INR' }));
      fireEvent.click(screen.getByRole('button', { name: /subscribe to studio/i }));
      await waitFor(() => expect(window.location.href).toBe('https://rzp.io/i/abc'));
      expect(Number(localStorage.getItem('cg-pending-payment'))).toBeGreaterThan(0);
    });

    test('a Stripe checkout does not set the flag', async () => {
      mockUser = { isPro: false };
      createCheckoutSession.mockResolvedValue({ data: { url: 'https://checkout.stripe.com/x', provider: 'stripe' } });
      renderCard();
      fireEvent.click(screen.getByRole('button', { name: /subscribe to studio/i }));
      await waitFor(() => expect(window.location.href).toBe('https://checkout.stripe.com/x'));
      expect(localStorage.getItem('cg-pending-payment')).toBeNull();
    });

    test('coming back, it confirms the payment and says so while it waits', async () => {
      mockUser = { isPro: false };
      localStorage.setItem('cg-pending-payment', String(Date.now()));
      renderCard();
      expect(await screen.findByText(/confirming your payment/i)).toBeInTheDocument();
      await waitFor(() => expect(syncPayment).toHaveBeenCalled());
      await waitFor(() => expect(refreshUser).toHaveBeenCalled());
    });

    test('"Check again" asks again', async () => {
      mockUser = { isPro: false };
      localStorage.setItem('cg-pending-payment', String(Date.now()));
      renderCard();
      await waitFor(() => expect(syncPayment).toHaveBeenCalledTimes(1));
      fireEvent.click(await screen.findByRole('button', { name: /check again/i }));
      await waitFor(() => expect(syncPayment).toHaveBeenCalledTimes(2));
    });

    test('an old flag (over 30 minutes) is ignored and never checks', async () => {
      mockUser = { isPro: false };
      localStorage.setItem('cg-pending-payment', String(Date.now() - 31 * 60 * 1000));
      renderCard();
      await waitFor(() => expect(getPaymentOptions).toHaveBeenCalled());
      expect(syncPayment).not.toHaveBeenCalled();
      expect(screen.queryByText(/confirming your payment/i)).not.toBeInTheDocument();
    });

    test('once the plan is on, the flag is cleared and nothing more is checked', async () => {
      mockUser = { isPro: true, proLifetime: false, paymentProvider: 'razorpay', subscriptionStatus: 'active', proPeriodEnd: FUTURE };
      localStorage.setItem('cg-pending-payment', String(Date.now()));
      renderCard();
      await waitFor(() => expect(localStorage.getItem('cg-pending-payment')).toBeNull());
      expect(syncPayment).not.toHaveBeenCalled();
    });

    test('a failed check is not an error shown to the buyer; it simply tries again later', async () => {
      mockUser = { isPro: false };
      localStorage.setItem('cg-pending-payment', String(Date.now()));
      syncPayment.mockRejectedValue(new Error('502'));
      renderCard();
      await waitFor(() => expect(syncPayment).toHaveBeenCalled());
      expect(screen.getByText(/confirming your payment/i)).toBeInTheDocument();
      expect(screen.queryByText(/502/)).not.toBeInTheDocument();
    });
  });

  describe.each([['razorpay'], ['paypal'], ['cashfree']])('a %s subscriber', (provider) => {
    const sub = (over = {}) => ({ isPro: true, proLifetime: false, paymentProvider: provider, subscriptionStatus: 'active', proPeriodEnd: FUTURE, plan: 'studio', tier: 'studio', ...over });

    test('has Cancel subscription instead of Manage billing, and no in-app Agency switch', () => {
      mockUser = sub();
      renderCard();
      expect(screen.getByRole('button', { name: /cancel subscription/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /manage billing/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /switch to agency/i })).not.toBeInTheDocument();
      expect(screen.getByText(/to move to agency, cancel at the end of this period/i)).toBeInTheDocument();
    });

    test('cancelling asks first, explains it cannot be resumed, then cancels and refreshes', async () => {
      mockUser = sub();
      cancelSubscription.mockResolvedValue({ data: { cancelAtPeriodEnd: true } });
      renderCard();
      fireEvent.click(screen.getByRole('button', { name: /cancel subscription/i }));
      const group = screen.getByRole('group', { name: /confirm cancel subscription/i });
      expect(group).toHaveTextContent(/can't be resumed/i);
      expect(cancelSubscription).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole('button', { name: /yes, cancel at period end/i }));
      await waitFor(() => expect(cancelSubscription).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(refreshUser).toHaveBeenCalled());
    });

    test('"Keep my plan" backs out without calling the server', () => {
      mockUser = sub();
      renderCard();
      fireEvent.click(screen.getByRole('button', { name: /cancel subscription/i }));
      fireEvent.click(screen.getByRole('button', { name: /keep my plan/i }));
      expect(cancelSubscription).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: /cancel subscription/i })).toBeInTheDocument();
    });

    test('a refusal from the server is shown', async () => {
      mockUser = sub();
      cancelSubscription.mockRejectedValue({ response: { data: { message: 'There is no active subscription to cancel' } } });
      renderCard();
      fireEvent.click(screen.getByRole('button', { name: /cancel subscription/i }));
      fireEvent.click(screen.getByRole('button', { name: /yes, cancel at period end/i }));
      expect(await screen.findByText(/no active subscription to cancel/i)).toBeInTheDocument();
    });

    test('once cancelled it says when Pro ends and to subscribe again then, with no cancel button', () => {
      mockUser = sub({ subscriptionCancelAtPeriodEnd: true });
      renderCard();
      expect(screen.getByText(/subscription is cancelled/i)).toBeInTheDocument();
      expect(screen.getByText(/subscribe again once this period ends/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /cancel subscription/i })).not.toBeInTheDocument();
    });

    test('a failed charge says it will be retried, not "update your payment method" (there is no portal)', () => {
      mockUser = sub({ subscriptionStatus: 'past_due' });
      renderCard();
      expect(screen.getByText(/will be tried again/i)).toBeInTheDocument();
      expect(screen.queryByText(/update your payment method/i)).not.toBeInTheDocument();
    });
  });
});
