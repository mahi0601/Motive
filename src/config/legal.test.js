import { describe, test, expect } from 'vitest';
import { TERMS_VERSION, TERMS_UPDATED_LABEL, SUPPORT_EMAIL } from './legal';

describe('legal config', () => {
  test('the version is a date, and the label shown on both pages is that same date', () => {
    expect(TERMS_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const d = new Date(`${TERMS_VERSION}T12:00:00Z`);
    const label = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
    expect(TERMS_UPDATED_LABEL).toBe(label);
  });

  test('has one support address for both pages', () => {
    expect(SUPPORT_EMAIL).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });
});
