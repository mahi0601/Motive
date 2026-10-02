import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LogoMark } from './Logo';
import { TERMS_UPDATED_LABEL } from '../../config/legal';

// The shell shared by the Terms and Privacy pages: back link, title, the
// last-updated date, and the not-legal-advice note. One place, so the two pages
// always carry the same date and the same honesty.
export const LegalSection = ({ title, children }) => (
  <section className="mt-8">
    <h2 className="font-display text-xl font-bold text-light-text dark:text-white">{title}</h2>
    <div className="mt-2 space-y-2 text-light-muted dark:text-dark-muted">{children}</div>
  </section>
);

export const LegalLink = ({ to, children }) => (
  <Link to={to} className="text-brand-600 hover:underline dark:text-brand-400">{children}</Link>
);

const LegalPage = ({ title, children }) => (
  <div className="min-h-screen bg-white px-6 py-12 dark:bg-dark-background">
    <div className="mx-auto max-w-2xl">
      <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-light-muted hover:text-brand-600 dark:text-dark-muted">
        <ArrowLeft size={16} /> Back to Clientglass
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <LogoMark size={36} />
        <h1 className="font-display text-display font-extrabold text-light-text dark:text-white">{title}</h1>
      </div>
      <p className="text-sm text-light-muted dark:text-dark-muted">Last updated: {TERMS_UPDATED_LABEL}</p>

      {children}

      <p className="mt-10 rounded-lg border border-light-border bg-light-border/30 p-4 text-xs text-light-muted dark:text-dark-muted dark:border-dark-border dark:bg-dark-surface">
        This page is provided as a starting template and is not legal advice. Please have it
        reviewed by a qualified professional before relying on it for your jurisdiction.
      </p>
    </div>
  </div>
);

export default LegalPage;
