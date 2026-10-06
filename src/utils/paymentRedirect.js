// Where the payment gateways send a buyer to pay. The checkout URL comes from our API, but it is
// followed with `window.location`, so it is checked first: https only, and only a host that belongs
// to one of the gateways we integrate. A wrong server setting (or a tampered response) then shows an
// error instead of sending someone to another site, or running a `javascript:` URL.
const GATEWAY_DOMAINS = ['stripe.com', 'razorpay.com', 'rzp.io', 'paypal.com', 'cashfree.com'];

export const safeCheckoutUrl = (url) => {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return null;
    const host = parsed.hostname.toLowerCase();
    return GATEWAY_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`)) ? parsed.href : null;
  } catch {
    return null;
  }
};

// Navigates to a gateway page, or throws a plain message when the URL is not one.
export const goToGateway = (url) => {
  const safe = safeCheckoutUrl(url);
  if (!safe) throw new Error('That payment page could not be opened safely. Please try again or contact support.');
  window.location.href = safe;
};
