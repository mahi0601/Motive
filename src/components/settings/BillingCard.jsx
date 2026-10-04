import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle, Star } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  cancelSubscription,
  changePlan,
  createCheckoutSession,
  createPortalSession,
  getPaymentOptions,
  reconcileCheckoutSession,
  syncPayment,
} from '../../services/paymentService';
import { PLANS, PAID_PLAN_KEYS, planBenefits, tierOf } from '../../config/plans';
import { logger } from '../../utils/logger';
import { CARD_CLASS } from './cardStyles';

// Set when someone is sent to Razorpay to pay, so that on coming back the card knows to ask
// whether the payment went through (Razorpay has no redirect back). Forgotten after 30 minutes.
const PENDING_KEY = 'cg-pending-payment';
const PENDING_MAX_MS = 30 * 60 * 1000;
const readPending = () => {
  try {
    const at = Number(localStorage.getItem(PENDING_KEY));
    return at > 0 && Date.now() - at < PENDING_MAX_MS;
  } catch {
    return false;
  }
};
const setPending = (on) => {
  try {
    if (on) localStorage.setItem(PENDING_KEY, String(Date.now()));
    else localStorage.removeItem(PENDING_KEY);
  } catch {
    // Storage can be blocked; the card then simply does not auto-check.
  }
};

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : null;

// Plan and billing. Three plans (Free, Studio, Agency), priced by active client;
// see config/plans.js. Three states: lifetime (bought the old one-time upgrade,
// never charged again, Agency features), subscriber (plan, status, renewal date,
// Manage billing), and free (pick a plan).
const BillingCard = () => {
  const { user, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tier = tierOf(user);

  // Upgrade flow — the buyer picks a plan and a currency for the monthly price.
  // Which payment methods Checkout then offers is Stripe's call (see
  // paymentService.js), so none are promised here.
  const CURRENCIES = [
    { code: 'usd', label: 'USD' },
    { code: 'inr', label: 'INR' },
  ];
  const [currency, setCurrency] = useState('usd');
  // Which provider takes each currency ({ usd, inr }; a value of null means unavailable).
  // null here means "not known yet", in which case checkout is allowed and the server decides.
  const [providers, setProviders] = useState(null);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');
  const upgradeStatus = searchParams.get('upgrade'); // 'success' | 'cancelled' | null
  const billingReturn = searchParams.get('billing'); // 'updated' after the Customer Portal
  const [openingPortal, setOpeningPortal] = useState(false);
  const [portalError, setPortalError] = useState('');

  // Studio -> Agency on the existing subscription. Asks first (it charges the
  // difference), and the button is disabled while the request is in flight so a
  // double click cannot send it twice.
  const [confirmingSwitch, setConfirmingSwitch] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState('');
  const [switched, setSwitched] = useState(false);

  // Razorpay subscribers cancel here (there is no customer portal). It ends at the end of the
  // paid period and cannot be undone, so it asks first.
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const isRazorpay = user?.paymentProvider === 'razorpay';

  // Back from paying on Razorpay: ask whether it went through, now, whenever the tab regains
  // focus, and every few seconds for a couple of minutes. Stops once the plan is on.
  const [awaitingPayment, setAwaitingPayment] = useState(() => readPending());
  const [checkingPayment, setCheckingPayment] = useState(false);
  const checkPayment = useCallback(async () => {
    setCheckingPayment(true);
    try {
      await syncPayment();
      await refreshUser();
    } catch (e) {
      logger.warn('Could not confirm the payment yet', { error: e?.message });
    } finally {
      setCheckingPayment(false);
    }
  }, [refreshUser]);

  useEffect(() => {
    if (user?.isPro) {
      setPending(false);
      setAwaitingPayment(false);
      return undefined;
    }
    if (!awaitingPayment) return undefined;
    if (!readPending()) {
      setAwaitingPayment(false);
      return undefined;
    }
    checkPayment();
    const onVisible = () => {
      if (document.visibilityState === 'visible') checkPayment();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (tries > 24) clearInterval(timer);
      else checkPayment();
    }, 5000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
      clearInterval(timer);
    };
  }, [awaitingPayment, user?.isPro, checkPayment]);

  // Ask the server which provider takes each currency, so an unavailable one is said up front.
  useEffect(() => {
    if (user?.isPro) return;
    getPaymentOptions()
      .then(({ data }) => setProviders(data?.providers ?? null))
      .catch((e) => logger.warn('Could not read payment options', { error: e?.message }));
  }, [user?.isPro]);

  const providerNow = providers ? providers[currency] : undefined; // undefined = unknown yet
  const unavailable = providers !== null && !providerNow;

  // Coming back from Stripe Checkout — reconcile directly against Stripe first
  // (covers UPI/delayed-notification methods, and a webhook that was ever
  // delayed or dropped: without this, isPro could stay false forever even
  // though the payment succeeded), then re-fetch the profile so `isPro`
  // reflects the confirmed state, then drop the query params.
  useEffect(() => {
    if (upgradeStatus !== 'success') return;
    const sessionId = searchParams.get('session_id');
    (sessionId ? reconcileCheckoutSession(sessionId) : Promise.resolve())
      .catch((e) => logger.warn('Failed to reconcile checkout session', { error: e.message }))
      .finally(() => {
        refreshUser().finally(() => {
          setSearchParams({}, { replace: true });
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upgradeStatus, refreshUser, setSearchParams]);

  // Back from the Customer Portal (card changed, plan cancelled, …): the
  // webhook may already have updated the subscription — re-read the profile.
  useEffect(() => {
    if (billingReturn !== 'updated') return;
    refreshUser()
      .catch((e) => logger.warn('Failed to refresh profile after billing portal', { error: e.message }))
      .finally(() => setSearchParams({}, { replace: true }));
  }, [billingReturn, refreshUser, setSearchParams]);

  const handleManageBilling = async () => {
    setOpeningPortal(true);
    setPortalError('');
    try {
      const { data } = await createPortalSession();
      window.location.href = data.url; // hand off to Stripe's Customer Portal
    } catch (err) {
      setPortalError(err?.response?.data?.message || 'Could not open billing. Try again.');
      setOpeningPortal(false);
    }
  };

  const handleSwitch = async () => {
    if (switching) return;
    setSwitching(true);
    setSwitchError('');
    try {
      await changePlan('agency');
      await refreshUser();
      setSwitched(true);
      setConfirmingSwitch(false);
    } catch (err) {
      setSwitchError(err?.response?.data?.message || 'Could not change your plan. Try again.');
    } finally {
      setSwitching(false);
    }
  };

  const handleCancel = async () => {
    if (cancelling) return;
    setCancelling(true);
    setCancelError('');
    try {
      await cancelSubscription();
      await refreshUser();
      setConfirmingCancel(false);
    } catch (err) {
      setCancelError(err?.response?.data?.message || 'Could not cancel. Try again, or contact support.');
    } finally {
      setCancelling(false);
    }
  };

  const handleUpgrade = async (plan) => {
    setUpgrading(true);
    setUpgradeError('');
    try {
      const { data } = await createCheckoutSession(currency, plan);
      // Razorpay has no redirect back, so remember to check on return.
      if (data.provider === 'razorpay') {
        setPending(true);
        setAwaitingPayment(true);
      }
      window.location.href = data.url; // hand off to the provider's checkout
    } catch (err) {
      setUpgradeError(err?.response?.data?.message || 'Could not start checkout. Try again.');
      setUpgrading(false);
    }
  };

  return (
    <div className={CARD_CLASS}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Star className="text-brand-500" />
          <h4 className="text-lg font-semibold">Plan and billing</h4>
        </div>
        {user?.isPro && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-semantic-success-50 text-semantic-success-700 dark:bg-semantic-success-500/10 dark:text-semantic-success-dark">
            <CheckCircle /> {user.proLifetime ? 'Lifetime Pro' : `${PLANS[tier].name} plan`}
          </span>
        )}
      </div>

      {user?.proLifetime ? (
        <p className="text-sm text-light-muted dark:text-dark-muted mt-2">
          Thanks for backing Clientglass early — you have Pro for life, with every Agency feature and nothing more to pay.
        </p>
      ) : user?.isPro ? (
        <div className="mt-2 space-y-2">
          <p className="text-sm text-light-muted dark:text-dark-muted">
            {user.subscriptionCancelAtPeriodEnd
              ? `Your subscription is cancelled — Pro stays on until ${formatDate(user.proPeriodEnd) || 'the end of this billing period'}.`
              : user.proPeriodEnd
              ? `Monthly subscription — renews on ${formatDate(user.proPeriodEnd)}.`
              : `Monthly subscription — everything in ${PLANS[tier].name} is unlocked.`}
          </p>
          {user.subscriptionStatus === 'past_due' && (
            <p className="text-sm rounded-lg border border-semantic-warning-200 bg-semantic-warning-50 px-3 py-2 text-semantic-warning-700 dark:border-semantic-warning-500/30 dark:bg-semantic-warning-500/10 dark:text-semantic-warning-dark">
              {isRazorpay
                ? "Your last payment didn't go through. It will be tried again; make sure your card or UPI account can cover it to keep your plan."
                : "Your last payment didn't go through. Update your payment method to keep your plan."}
            </p>
          )}
          {isRazorpay ? (
            <div className="space-y-2">
              {user.subscriptionCancelAtPeriodEnd ? (
                <p className="text-xs text-light-muted dark:text-dark-muted">
                  To continue after {formatDate(user.proPeriodEnd) || 'then'}, subscribe again once this period ends.
                </p>
              ) : confirmingCancel ? (
                <div role="group" aria-label="Confirm cancel subscription" className="rounded-lg border border-light-border dark:border-dark-border p-3 space-y-2">
                  <p className="text-sm text-light-text dark:text-dark-text">
                    Cancel at the end of this billing period? You keep {PLANS[tier].name} until {formatDate(user.proPeriodEnd) || 'then'} and are not charged again. A cancelled subscription can't be resumed: you would subscribe again afterwards.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="px-4 py-2 text-sm rounded-lg font-medium border border-semantic-danger-500 text-semantic-danger-700 transition hover:bg-semantic-danger-50 dark:text-semantic-danger-dark disabled:opacity-60"
                    >
                      {cancelling ? 'Cancelling…' : 'Yes, cancel at period end'}
                    </button>
                    <button
                      onClick={() => { setConfirmingCancel(false); setCancelError(''); }}
                      disabled={cancelling}
                      className="px-4 py-2 text-sm rounded-lg font-medium border border-light-border dark:border-dark-border text-light-text dark:text-dark-text disabled:opacity-60"
                    >
                      Keep my plan
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmingCancel(true)}
                  className="px-4 py-2 text-sm rounded-lg font-medium border border-brand-600 text-brand-600 transition hover:bg-brand-600 hover:text-white dark:border-white dark:text-white"
                >
                  Cancel subscription
                </button>
              )}
              {cancelError && <p className="text-xs text-semantic-danger-700 dark:text-semantic-danger-dark">{cancelError}</p>}
            </div>
          ) : (
            <>
              <button
                onClick={handleManageBilling}
                disabled={openingPortal}
                className="px-4 py-2 text-sm rounded-lg font-medium border border-brand-600 text-brand-600 transition hover:bg-brand-600 hover:text-white dark:border-white dark:text-white disabled:opacity-60"
              >
                {openingPortal ? 'Opening…' : 'Manage billing'}
              </button>
              {portalError && <p className="text-xs text-semantic-danger-700 dark:text-semantic-danger-dark">{portalError}</p>}
            </>
          )}
          {tier === 'studio' && isRazorpay && !user.subscriptionCancelAtPeriodEnd && (
            <p className="text-xs text-light-muted dark:text-dark-muted">
              To move to Agency, cancel at the end of this period and subscribe to Agency, or contact support.
            </p>
          )}
          {tier === 'studio' && !isRazorpay && (
            <div className="pt-1 space-y-2">
              {switched && (
                <p role="status" className="text-sm text-semantic-success-700 dark:text-semantic-success-dark">
                  You're now on Agency. The difference for this billing period is prorated on your next invoice.
                </p>
              )}
              {user.subscriptionStatus === 'past_due' ? (
                <p className="text-xs text-light-muted dark:text-dark-muted">Fix your payment to switch to Agency.</p>
              ) : user.subscriptionCancelAtPeriodEnd ? (
                <p className="text-xs text-light-muted dark:text-dark-muted">Resume your subscription to switch to Agency.</p>
              ) : confirmingSwitch ? (
                <div role="group" aria-label="Confirm switch to Agency" className="rounded-lg border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/20 p-3 space-y-2">
                  <p className="text-sm text-light-text dark:text-dark-text">
                    Agency is {PLANS.agency.price.usd} / {PLANS.agency.price.inr} a month, charged in the currency you already pay in. You'll pay the prorated difference for the rest of this billing period, then the Agency price each month.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSwitch}
                      disabled={switching}
                      className="px-4 py-2 text-sm rounded-lg font-medium bg-brand-gradient text-white transition-all duration-300 shadow-brand-sm hover:shadow-brand disabled:opacity-60"
                    >
                      {switching ? 'Switching…' : 'Confirm switch'}
                    </button>
                    <button
                      onClick={() => { setConfirmingSwitch(false); setSwitchError(''); }}
                      disabled={switching}
                      className="px-4 py-2 text-sm rounded-lg font-medium border border-light-border dark:border-dark-border text-light-text dark:text-dark-text disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                !switched && (
                  <button
                    onClick={() => setConfirmingSwitch(true)}
                    className="px-4 py-2 text-sm rounded-lg font-medium border border-brand-600 text-brand-600 transition hover:bg-brand-600 hover:text-white dark:border-white dark:text-white"
                  >
                    Switch to Agency
                  </button>
                )
              )}
              {switchError && <p className="text-xs text-semantic-danger-700 dark:text-semantic-danger-dark">{switchError}</p>}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-2 space-y-1">
          <p className="text-sm text-light-muted dark:text-dark-muted">
            You're on Free: {PLANS.free.clients} active client page and up to {PLANS.free.members} team members per workspace.
          </p>
          <p className="text-sm text-light-muted dark:text-dark-muted">
            Upgrade with a monthly subscription, priced by active client. Cancel any time.
          </p>
        </div>
      )}

      {!user?.isPro && (
        <>
          <div className="mt-4 flex items-center gap-2" role="group" aria-label="Currency">
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                type="button"
                aria-pressed={currency === c.code}
                onClick={() => setCurrency(c.code)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                  currency === c.code
                    ? 'border-brand-500 ring-1 ring-brand-500 bg-brand-50 dark:bg-brand-900/20 text-light-text dark:text-dark-text'
                    : 'border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted hover:border-brand-400'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {awaitingPayment && (
            <div role="status" className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/20 px-3 py-2 text-sm text-light-text dark:text-dark-text">
              <span>Confirming your payment… this can take a minute after you pay. Your plan switches on as soon as it is confirmed.</span>
              <button
                type="button"
                onClick={checkPayment}
                disabled={checkingPayment}
                className="rounded-lg border border-brand-600 px-3 py-1 text-xs font-medium text-brand-600 dark:border-white dark:text-white disabled:opacity-60"
              >
                {checkingPayment ? 'Checking…' : 'Check again'}
              </button>
            </div>
          )}
          {unavailable && (
            <p role="alert" className="mt-3 rounded-lg border border-semantic-warning-200 bg-semantic-warning-50 px-3 py-2 text-sm text-semantic-warning-700 dark:border-semantic-warning-500/30 dark:bg-semantic-warning-500/10 dark:text-semantic-warning-dark">
              Payments in {currency.toUpperCase()} aren't available yet. Please try again later{providers && (providers.usd || providers.inr) ? ' or choose the other currency' : ''}.
            </p>
          )}

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {PAID_PLAN_KEYS.map((key) => {
              const plan = PLANS[key];
              return (
                <div key={key} className="flex flex-col rounded-xl border border-light-border dark:border-dark-border p-4">
                  <h5 className="text-base font-semibold text-light-text dark:text-dark-text">{plan.name}</h5>
                  <p className="text-sm text-light-muted dark:text-dark-muted">{plan.blurb}</p>
                  <p className="mt-2 text-lg font-bold text-light-text dark:text-dark-text">{plan.price[currency]} / month</p>
                  <ul className="mt-3 flex-1 space-y-1.5 text-sm text-light-text dark:text-dark-text">
                    {planBenefits(key).map((line) => (
                      <li key={line} className="flex items-start gap-2">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                        {line}
                      </li>
                    ))}
                  </ul>
                  {/* The one gradient on this screen — the highest-value action
                      here, so it keeps the spotlight; the rest are tonal. */}
                  <button
                    onClick={() => handleUpgrade(key)}
                    disabled={upgrading || unavailable}
                    className="mt-4 px-4 py-2 text-sm rounded-lg font-medium bg-brand-gradient text-white transition-all duration-300 shadow-brand-sm hover:shadow-brand disabled:opacity-60"
                  >
                    {upgrading ? 'Redirecting…' : `Subscribe to ${plan.name}`}
                  </button>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-light-muted dark:text-dark-muted mt-2">
            {providerNow === 'razorpay'
              ? "You'll pay on Razorpay's secure checkout. The methods offered (cards, UPI) depend on what your bank supports."
              : providerNow === 'stripe'
                ? "You'll pick how to pay on Stripe's secure checkout — the methods offered depend on your currency and region."
                : "You'll pick how to pay on our payment provider's secure checkout — the methods offered depend on your currency and region."}
          </p>
        </>
      )}

      {upgradeError && <p className="text-xs text-semantic-danger-700 dark:text-semantic-danger-dark mt-2">{upgradeError}</p>}
      {upgradeStatus === 'cancelled' && !user?.isPro && (
        <p className="text-xs text-semantic-warning-700 dark:text-semantic-warning-dark mt-2">Checkout was cancelled — no charge was made.</p>
      )}
    </div>
  );
};

export default BillingCard;
