import React from 'react';
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Terms from './Terms';
import { TERMS_UPDATED_LABEL, SUPPORT_EMAIL } from '../config/legal';

const renderTerms = () => render(<MemoryRouter><Terms /></MemoryRouter>);

describe('Terms page', () => {
  test('has a title, the shared last-updated date and a way back', () => {
    renderTerms();
    expect(screen.getByRole('heading', { level: 1, name: /terms of service/i })).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Last updated: ${TERMS_UPDATED_LABEL}`))).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to clientglass/i })).toHaveAttribute('href', '/');
  });

  test.each([
    'Who can use Clientglass',
    'Your account',
    'Your content and your clients’ pages',
    'Acceptable use',
    'Plans and billing',
    'Ending your account',
    'Changes to these terms',
    'Contact',
  ])('covers "%s"', (title) => {
    renderTerms();
    expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument();
  });

  test('states the age rule the sign-up checkbox relies on', () => {
    renderTerms();
    expect(screen.getByText(/16 years old or older/i)).toBeInTheDocument();
  });

  test('describes billing the way the product actually works', () => {
    renderTerms();
    const text = document.body.textContent;
    expect(text).toMatch(/monthly subscription/i);
    expect(text).toMatch(/active client page/i);
    expect(text).toMatch(/prorated/i);
    expect(text).toMatch(/cancel/i);
    expect(text).toMatch(/lifetime/i);
  });

  test('links the privacy policy and the support address', () => {
    renderTerms();
    expect(screen.getAllByRole('link', { name: /privacy policy/i })[0]).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: SUPPORT_EMAIL })).toHaveAttribute('href', `mailto:${SUPPORT_EMAIL}`);
  });

  test('says plainly that it is not legal advice and needs review, like the privacy page does', () => {
    renderTerms();
    expect(screen.getByText(/not legal advice/i)).toBeInTheDocument();
  });
});
