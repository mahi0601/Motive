import api from './api';

// Starts a Stripe Checkout session for the monthly Pro subscription; resolves
// to the Checkout URL the caller should redirect the browser to. `currency`
// ('usd' | 'inr') picks the price currency; which payment methods Checkout
// offers for a recurring payment in it is decided by Stripe.
export const createCheckoutSession = (currency = 'usd') =>
  api.post('/api/payments/create-checkout-session', { currency });

// Opens Stripe's hosted Customer Portal (update card, invoices, cancel) —
// resolves to the URL to redirect to. Only works for someone with a billing
// account, i.e. an existing subscriber.
export const createPortalSession = () => api.post('/api/payments/portal');

// Fallback for the success-redirect: confirms (and backfills if needed) isPro
// directly from Stripe, in case the webhook was delayed or dropped — e.g. a
// delayed-notification payment method.
export const reconcileCheckoutSession = (sessionId) => api.get(`/api/payments/session/${sessionId}`);
