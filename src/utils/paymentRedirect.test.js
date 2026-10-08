import { describe, expect, test } from 'vitest';
import { safeCheckoutUrl } from './paymentRedirect';

describe('safeCheckoutUrl', () => {
  test('accepts https pages on the gateways', () => {
    expect(safeCheckoutUrl('https://checkout.stripe.com/c/pay/abc')).toBe('https://checkout.stripe.com/c/pay/abc');
    expect(safeCheckoutUrl('https://billing.stripe.com/p/session/x')).toBeTruthy();
    expect(safeCheckoutUrl('https://rzp.io/i/abc')).toBeTruthy();
    expect(safeCheckoutUrl('https://www.sandbox.paypal.com/webapps/billing/subscriptions?ba_token=1')).toBeTruthy();
  });
  test('refuses other hosts, look-alikes, plain http, javascript: and junk', () => {
    expect(safeCheckoutUrl('https://evil.example/stripe.com')).toBeNull();
    expect(safeCheckoutUrl('https://stripe.com.evil.example/')).toBeNull();
    expect(safeCheckoutUrl('https://notstripe.com/')).toBeNull();
    expect(safeCheckoutUrl('http://checkout.stripe.com/')).toBeNull();
    expect(safeCheckoutUrl('javascript:alert(1)')).toBeNull();
    expect(safeCheckoutUrl(undefined)).toBeNull();
  });
});
