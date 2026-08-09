import api from './api';

// Starts a one-time Stripe Checkout session for the Pro upgrade; resolves to
// the Checkout URL the caller should redirect the browser to. `currency`
// ('usd' | 'inr') decides which payment methods Stripe can offer — see
// paymentService currency options in Settings for why this matters.
export const createCheckoutSession = (currency = 'usd') =>
  api.post('/api/payments/create-checkout-session', { currency });
