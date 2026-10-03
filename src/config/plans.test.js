import { describe, test, expect } from 'vitest';
import { PLANS, PLAN_ORDER, PAID_PLAN_KEYS, tierOf, memberLimit, planBenefits, activeClients, nextPlanOf } from './plans';

describe('plans config', () => {
  test('the numbers the backend enforces (motive-backend src/utils/plans.js)', () => {
    expect(PLANS.free).toMatchObject({ clients: 1, members: 2 });
    expect(PLANS.studio).toMatchObject({ clients: 10, members: 5 });
    expect(PLANS.agency).toMatchObject({ clients: Infinity, members: 15 });
  });

  test('plans run cheapest to dearest, and only studio and agency can be bought', () => {
    expect(PLAN_ORDER).toEqual(['free', 'studio', 'agency']);
    expect(PAID_PLAN_KEYS).toEqual(['studio', 'agency']);
  });

  test('the prices match the backend defaults, which are placeholders to confirm with buyers', () => {
    expect(PLANS.studio.price).toEqual({ usd: '$19', inr: '₹999' });
    expect(PLANS.agency.price).toEqual({ usd: '$49', inr: '₹2,499' });
    expect(PLANS.free.price).toEqual({ usd: '$0', inr: '₹0' });
  });
});

describe('tierOf', () => {
  test('uses the tier the server reports', () => {
    expect(tierOf({ tier: 'studio', isPro: true })).toBe('studio');
    expect(tierOf({ tier: 'agency', isPro: true })).toBe('agency');
    expect(tierOf({ tier: 'free', isPro: false })).toBe('free');
  });

  test('a profile saved before tiers existed falls back on isPro: paid means Agency, as on the server', () => {
    expect(tierOf({ isPro: true })).toBe('agency');
    expect(tierOf({ isPro: false })).toBe('free');
  });

  test('nobody signed in is free', () => {
    expect(tierOf(null)).toBe('free');
    expect(tierOf(undefined)).toBe('free');
  });

  test('an unknown tier value is treated as the profile\'s paid state, never trusted', () => {
    expect(tierOf({ tier: 'platinum', isPro: false })).toBe('free');
    expect(tierOf({ tier: 'platinum', isPro: true })).toBe('agency');
  });
});

describe('memberLimit', () => {
  test('is the plan\'s team size', () => {
    expect(memberLimit('free')).toBe(2);
    expect(memberLimit('studio')).toBe(5);
    expect(memberLimit('agency')).toBe(15);
  });
});

describe('planBenefits lists every real difference, so the billing card cannot leave one out', () => {
  test('free', () => {
    expect(planBenefits('free')).toEqual([
      '1 active client page',
      'Up to 2 team members per workspace',
      'Shows “Powered by Clientglass” on client pages',
      '100 MB file storage',
      'Momentum for the current week',
    ]);
  });

  test('studio', () => {
    expect(planBenefits('studio')).toEqual([
      '10 active client pages',
      'Up to 5 team members per workspace',
      'Remove the “Powered by Clientglass” footer',
      '2 GB file storage',
      'Momentum month and quarter views',
    ]);
  });

  test('agency', () => {
    expect(planBenefits('agency')).toEqual([
      'Unlimited active client pages',
      'Up to 15 team members per workspace',
      'Remove the “Powered by Clientglass” footer',
      '2 GB file storage',
      'Momentum month and quarter views',
    ]);
  });
});

describe('activeClients', () => {
  const live = '2026-10-01T00:00:00.000Z';
  test('counts only the workspaces you own that have a live status link', () => {
    const list = [
      { id: 'a', ownerId: 'me', shareEnabledAt: live },
      { id: 'b', ownerId: 'me', shareEnabledAt: null },
      { id: 'c', ownerId: 'someone-else', shareEnabledAt: live }, // you are only a member
      { id: 'd', ownerId: 'me', shareEnabledAt: live },
    ];
    expect(activeClients(list, 'me')).toBe(2);
  });

  test('is zero for an empty, missing or signed-out input', () => {
    expect(activeClients([], 'me')).toBe(0);
    expect(activeClients(undefined, 'me')).toBe(0);
    expect(activeClients(null, 'me')).toBe(0);
    expect(activeClients([{ ownerId: 'me', shareEnabledAt: live }], undefined)).toBe(0);
  });
});

describe('nextPlanOf', () => {
  test('is the plan above, and nothing above Agency', () => {
    expect(nextPlanOf('free')).toBe('studio');
    expect(nextPlanOf('studio')).toBe('agency');
    expect(nextPlanOf('agency')).toBeNull();
  });
});
