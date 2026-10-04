import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { StatusPageView } from './StatusPage';
import { buildDemoStatus } from '../config/demoStatus';

// An example client status page with made-up data, so a visitor can see what their
// client would see before signing up. It is the real page (StatusPageView) fed fixed
// data; nothing is fetched or sent, and a banner says so.
const ExampleNotice = () => (
  <aside
    role="note"
    aria-label="Example page"
    className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-light-text dark:border-brand-800 dark:bg-brand-900/20 dark:text-dark-text"
  >
    <p>
      <strong>This is an example page with made-up data.</strong> It is what your client sees: a link, no account.
    </p>
    <Link to="/register" className="rounded-lg bg-brand-gradient px-4 py-2 font-medium text-white shadow-brand-sm transition hover:shadow-brand">
      Start free
    </Link>
  </aside>
);

const Demo = () => {
  const status = useMemo(() => buildDemoStatus(new Date()), []);
  return <StatusPageView status={status} token="demo" demo notice={<ExampleNotice />} />;
};

export default Demo;
