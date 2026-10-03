// The plans, in one place: what the pricing page and the billing card display.
// The numbers mirror what the backend ENFORCES (motive-backend src/utils/plans.js)
// and charges (STUDIO_/AGENCY_PRICE_* in its environment). The prices here are
// placeholders until they are checked with real buyers; when they change, change
// them in both repos. This file is a display copy only, never the enforcement.
//
// Plans are priced by ACTIVE CLIENT: a workspace with a live client status link.
// A client never needs an account or a seat.
export const PLAN_ORDER = ['free', 'studio', 'agency'];
export const PAID_PLAN_KEYS = ['studio', 'agency'];

export const PLANS = {
  free: {
    key: 'free',
    name: 'Free',
    clients: 1,
    members: 2,
    storage: '100 MB',
    hideBranding: false,
    longMomentum: false,
    price: { usd: '$0', inr: '₹0' },
    blurb: 'Try it on your first client.',
  },
  studio: {
    key: 'studio',
    name: 'Studio',
    clients: 10,
    members: 5,
    storage: '2 GB',
    hideBranding: true,
    longMomentum: true,
    price: { usd: '$19', inr: '₹999' },
    blurb: 'For a small studio with a handful of clients.',
  },
  agency: {
    key: 'agency',
    name: 'Agency',
    clients: Infinity,
    members: 15,
    storage: '2 GB',
    hideBranding: true,
    longMomentum: true,
    price: { usd: '$49', inr: '₹2,499' },
    blurb: 'For an agency running many clients at once.',
  },
};

// What the account is entitled to right now. The server reports `tier`; an older
// profile saved in the browser before tiers existed has only `isPro`, and the
// server treats those accounts as Agency, so this does too. Anything unrecognised
// is never trusted: unpaid is Free, paid-but-unknown is Agency.
export const tierOf = (user) => {
  if (!user || !user.isPro) return 'free';
  return PAID_PLAN_KEYS.includes(user.tier) ? user.tier : 'agency';
};

export const memberLimit = (tier) => (PLANS[tier] || PLANS.free).members;

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// Every real difference between plans as a list of lines, so a card can never
// leave one out.
export const planBenefits = (key) => {
  const p = PLANS[key];
  return [
    p.clients === Infinity ? 'Unlimited active client pages' : plural(p.clients, 'active client page', 'active client pages'),
    `Up to ${p.members} team members per workspace`,
    p.hideBranding ? 'Remove the “Powered by Clientglass” footer' : 'Shows “Powered by Clientglass” on client pages',
    `${p.storage} file storage`,
    p.longMomentum ? 'Momentum month and quarter views' : 'Momentum for the current week',
  ];
};

// How many client pages are live that YOU run: workspaces you own with a status
// link switched on. (A workspace you only belong to is somebody else's client.)
export const activeClients = (workspaces, userId) =>
  userId ? (workspaces || []).filter((w) => w.ownerId === userId && w.shareEnabledAt).length : 0;

// The plan above, for "upgrade to X" wording; null at the top.
export const nextPlanOf = (tier) => PLAN_ORDER[PLAN_ORDER.indexOf(tier) + 1] || null;
