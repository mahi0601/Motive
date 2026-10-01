import React, { useEffect, useState } from 'react';
import { CheckCircle, Star } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createCheckoutSession, createPortalSession, reconcileCheckoutSession } from '../../services/paymentService';
import { FREE_MEMBER_LIMIT } from '../../config/limits';
import { logger } from '../../utils/logger';
import { CARD_CLASS } from './cardStyles';

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : null;

// Motive Pro — a monthly subscription. Three states: lifetime (bought the old
// one-time upgrade, never charged again), subscriber (status, renewal date,
// Manage billing), and free (upgrade).
const BillingCard = () => {
  const { user, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Upgrade flow — the buyer picks a currency for the monthly price. Which
  // payment methods Checkout then offers is Stripe's call (see paymentService.js),
  // so none are promised here.
  const CURRENCIES = [
    { code: 'usd', label: '$9.99 USD / month' },
    { code: 'inr', label: '₹799 INR / month' },
  ];
  const [currency, setCurrency] = useState('usd');
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');
  const upgradeStatus = searchParams.get('upgrade'); // 'success' | 'cancelled' | null
  const billingReturn = searchParams.get('billing'); // 'updated' after the Customer Portal
  const [openingPortal, setOpeningPortal] = useState(false);
  const [portalError, setPortalError] = useState('');

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

  const handleUpgrade = async () => {
    setUpgrading(true);
    setUpgradeError('');
    try {
      const { data } = await createCheckoutSession(currency);
      window.location.href = data.url; // hand off to Stripe Checkout
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
          <h4 className="text-lg font-semibold">Motive Pro</h4>
        </div>
        {user?.isPro && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-semantic-success-50 text-semantic-success-500 dark:bg-semantic-success-500/10 dark:text-semantic-success-dark">
            <CheckCircle /> {user.proLifetime ? 'Lifetime Pro' : "You're a Pro member"}
          </span>
        )}
      </div>

      {user?.proLifetime ? (
        <p className="text-sm text-light-muted dark:text-dark-muted mt-2">
          Thanks for backing Motive early — you have Pro for life, with nothing more to pay.
        </p>
      ) : user?.isPro ? (
        <div className="mt-2 space-y-2">
          <p className="text-sm text-light-muted dark:text-dark-muted">
            {user.subscriptionCancelAtPeriodEnd
              ? `Your subscription is cancelled — Pro stays on until ${formatDate(user.proPeriodEnd) || 'the end of this billing period'}.`
              : user.proPeriodEnd
              ? `Monthly subscription — renews on ${formatDate(user.proPeriodEnd)}.`
              : 'Monthly subscription — all Pro features are unlocked.'}
          </p>
          {user.subscriptionStatus === 'past_due' && (
            <p className="text-sm rounded-lg border border-semantic-warning-200 bg-semantic-warning-50 px-3 py-2 text-semantic-warning-700 dark:border-semantic-warning-500/30 dark:bg-semantic-warning-500/10 dark:text-semantic-warning-dark">
              Your last payment didn't go through. Update your payment method to keep Pro.
            </p>
          )}
          <button
            onClick={handleManageBilling}
            disabled={openingPortal}
            className="px-4 py-2 text-sm rounded-lg font-medium border border-brand-600 text-brand-600 transition hover:bg-brand-600 hover:text-white dark:border-white dark:text-white disabled:opacity-60"
          >
            {openingPortal ? 'Opening…' : 'Manage billing'}
          </button>
          {portalError && <p className="text-xs text-semantic-danger-500 dark:text-semantic-danger-dark">{portalError}</p>}
        </div>
      ) : (
        <p className="text-sm text-light-muted dark:text-dark-muted mt-2">
          Unlock Pro features with a monthly subscription. Cancel any time.
        </p>
      )}

      {/* Naming what Pro actually unlocks — was previously left
          implicit (just "Pro features"), which is a bad look when
          there's more than one gate to be honest about. */}
      {!user?.isPro && (
        <ul className="mt-3 space-y-1.5 text-sm text-light-text dark:text-dark-text">
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0 text-brand-500" />
            Month and quarter views on Momentum, not just this week
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0 text-brand-500" />
            Invite more than {FREE_MEMBER_LIMIT} workspace members
          </li>
        </ul>
      )}

      {!user?.isPro && (
        <>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setCurrency(c.code)}
                className={`text-left rounded-lg border px-3 py-2 transition-all duration-200 ${
                  currency === c.code
                    ? 'border-brand-500 ring-1 ring-brand-500 bg-brand-50 dark:bg-brand-900/20'
                    : 'border-light-border dark:border-dark-border hover:border-brand-400'
                }`}
              >
                <span className="block text-sm font-semibold text-light-text dark:text-dark-text">{c.label}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-light-muted dark:text-dark-muted mt-2">
            You'll pick how to pay on Stripe's secure checkout — the methods offered depend on your currency and region.
          </p>
          {/* The one gradient on this screen — the highest-value action
              here, so it's the one that keeps the spotlight. Avatar badge /
              Enable Alerts / Invite above are all tonal now for that
              reason. */}
          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            className="mt-3 px-4 py-2 text-sm rounded-lg font-medium bg-brand-gradient text-white transition-all duration-300 shadow-brand-sm hover:shadow-brand disabled:opacity-60"
          >
            {upgrading ? 'Redirecting…' : 'Subscribe to Pro'}
          </button>
        </>
      )}

      {upgradeError && <p className="text-xs text-semantic-danger-500 dark:text-semantic-danger-dark mt-2">{upgradeError}</p>}
      {upgradeStatus === 'cancelled' && !user?.isPro && (
        <p className="text-xs text-semantic-warning-700 dark:text-semantic-warning-dark mt-2">Checkout was cancelled — no charge was made.</p>
      )}
    </div>
  );
};

export default BillingCard;
