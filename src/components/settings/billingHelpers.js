// Small, UI-free helpers for the billing card: the pending-payment flag, the Cashfree checkout
// loader, the phone rule and date formatting. Kept apart so BillingCard.jsx is about the screen.

// Set when someone is sent to Razorpay to pay, so that on coming back the card knows to ask
// whether the payment went through (Razorpay has no redirect back). Forgotten after 30 minutes.
const PENDING_KEY = 'cg-pending-payment';
const PENDING_MAX_MS = 30 * 60 * 1000;
// The flag also records WHO started the payment: on a shared browser, the next person to sign in must
// not poll the payment API for someone else's checkout.
const PENDING_OWNER_KEY = 'cg-pending-payment-user';
export const readPending = (userId) => {
  try {
    const at = Number(localStorage.getItem(PENDING_KEY));
    const owner = localStorage.getItem(PENDING_OWNER_KEY);
    if (owner && userId && owner !== userId) return false;
    return at > 0 && Date.now() - at < PENDING_MAX_MS;
  } catch {
    return false;
  }
};
export const setPending = (on, userId) => {
  try {
    if (on) {
      localStorage.setItem(PENDING_KEY, String(Date.now()));
      if (userId) localStorage.setItem(PENDING_OWNER_KEY, userId);
    } else {
      localStorage.removeItem(PENDING_KEY);
      localStorage.removeItem(PENDING_OWNER_KEY);
    }
  } catch {
    // Storage can be blocked; the card then simply does not auto-check.
  }
};

// An Indian mobile number: ten digits starting 6 to 9, optionally with +91, 91 or 0 in front (the same
// rule the server applies; the server is what decides).
export const PHONE_PATTERN = /^(?:\+?91|0)?[6-9]\d{9}$/;

// Cashfree opens its checkout with its own script from a session id. Loaded on demand, once, from
// Cashfree's host (which a Content-Security-Policy must allow; see the README). A blocked or failed
// load becomes a plain message, never a hung button.
const CASHFREE_SDK = 'https://sdk.cashfree.com/js/v3/cashfree.js';
const loadCashfree = () =>
  new Promise((resolve, reject) => {
    if (window.Cashfree) return resolve(window.Cashfree);
    const script = document.createElement('script');
    script.src = CASHFREE_SDK;
    script.async = true;
    script.onload = () => (window.Cashfree ? resolve(window.Cashfree) : reject(new Error('The payment window did not load.')));
    script.onerror = () => reject(new Error('Could not load the payment window. Check your connection or ad blocker, then try again.'));
    document.head.appendChild(script);
  });
export const openCashfreeCheckout = async ({ sessionId, mode }) => {
  const Cashfree = await loadCashfree();
  // Same tab, so Cashfree sends the buyer back to the billing card when it is done.
  const result = await Cashfree({ mode: mode === 'production' ? 'production' : 'sandbox' }).subscriptionsCheckout({ subsSessionId: sessionId, redirectTarget: '_self' });
  // The SDK reports a failure by resolving with { error }, not by throwing: without this the button
  // would stay on "Redirecting…" and the card would wait 30 minutes for a payment that never began.
  if (result?.error) throw new Error(result.error.message || 'The payment window could not be opened. Please try again.');
};

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : null;
