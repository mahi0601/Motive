import React from 'react';
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Privacy from './Privacy';
import { TERMS_UPDATED_LABEL, SUPPORT_EMAIL } from '../config/legal';

const renderPrivacy = () => render(<MemoryRouter><Privacy /></MemoryRouter>);
const text = () => document.body.textContent.replace(/\s+/g, ' ');

describe('Privacy page matches what the product does', () => {
  test('shows the shared last-updated date', () => {
    renderPrivacy();
    expect(screen.getByText(new RegExp(`Last updated: ${TERMS_UPDATED_LABEL}`))).toBeInTheDocument();
  });

  test('says the service is for people aged 16 and over, instead of only "we do not knowingly collect"', () => {
    renderPrivacy();
    expect(text()).toMatch(/16 years old or older/i);
  });

  test('describes the security log, product analytics and client sign-offs', () => {
    renderPrivacy();
    expect(text()).toMatch(/security log/i);
    expect(text()).toMatch(/product events|product analytics/i);
    expect(text()).toMatch(/no third-party analytics|no third‑party analytics/i);
    expect(text()).toMatch(/approves? a milestone/i);
  });

  test('says uploaded files have a public link, so nobody assumes they are access-controlled', () => {
    renderPrivacy();
    expect(text()).toMatch(/anyone who has the link can open the file/i);
  });

  test('gives retention periods and the data download', () => {
    renderPrivacy();
    expect(text()).toMatch(/how long we keep data/i);
    expect(text()).toMatch(/download my data/i);
    expect(text()).toMatch(/cancels? (your|a) (monthly )?subscription/i);
  });

  test('names Vercel and says logs and errors have tokens removed', () => {
    renderPrivacy();
    expect(text()).toMatch(/Vercel/);
    expect(text()).toMatch(/removed/i);
  });

  test('the status page section mentions the client sign-off date but not the name', () => {
    renderPrivacy();
    expect(text()).toMatch(/only the date/i);
  });

  test('links the terms and uses the shared support address', () => {
    renderPrivacy();
    expect(screen.getAllByRole('link', { name: /terms of service/i })[0]).toHaveAttribute('href', '/terms');
    expect(screen.getByRole('link', { name: SUPPORT_EMAIL })).toHaveAttribute('href', `mailto:${SUPPORT_EMAIL}`);
  });
});
