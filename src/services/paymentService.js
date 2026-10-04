import api from './api';

// Starts a Stripe Checkout session for a monthly subscription; resolves to the
// Checkout URL the caller should redirect the browser to. `currency` ('usd' |
// 'inr') picks the price currency and `plan` ('studio' | 'agency') the plan;
// which payment methods Checkout offers for a recurring payment in it is
// decided by Stripe.
export const createCheckoutSession = (currency = 'usd', plan = 'studio') =>
  api.post('/api/payments/create-checkout-session', { currency, plan });

// Moves a Studio subscriber to Agency on their existing subscription (prorated);
// no second checkout. Only 'agency' is accepted, and the server refuses it unless
// the subscription is healthy and not set to end.
export const changePlan = (plan = 'agency') => api.post('/api/payments/change-plan', { plan });

// Opens Stripe's hosted Customer Portal (update card, invoices, cancel) —
// resolves to the URL to redirect to. Only works for someone with a billing
// account, i.e. an existing subscriber.
export const createPortalSession = () => api.post('/api/payments/portal');

// Fallback for the success-redirect: confirms (and backfills if needed) isPro
// directly from Stripe, in case the webhook was delayed or dropped — e.g. a
// delayed-notification payment method.
export const reconcileCheckoutSession = (sessionId) => api.get(`/api/payments/session/${sessionId}`);

// Which payment provider takes each currency right now: { usd, inr }, each 'stripe',
// 'razorpay' or null (nothing can take it). Lets the billing card say so before a click.
export const getPaymentOptions = () => api.get('/api/payments/options');

// Razorpay has no redirect back to the site and no customer portal. After paying there the
// app asks for the current state (the fallback for a late webhook), and a subscriber cancels
// here, at the end of the paid period.
export const syncPayment = () => api.post('/api/payments/sync');
export const cancelSubscription = () => api.post('/api/payments/cancel');
