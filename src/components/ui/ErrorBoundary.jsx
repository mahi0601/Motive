import React from 'react';
import { LogoMark } from './Logo';
import { logger } from '../../utils/logger';

/**
 * Global error boundary — catches any render/runtime error in the React tree
 * and shows a branded fallback instead of a blank white screen.
 * (Class component because only class lifecycles can catch render errors.)
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // The one case in this app where logger.error is exactly right at the
    // call site (not just via the api.js chokepoint) — a React render crash
    // never goes through an API call, so nothing else reports it to Sentry.
    logger.error('Uncaught UI error', error, { componentStack: info?.componentStack });
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.assign('/');
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-light-background px-6 text-center dark:bg-dark-background">
        <LogoMark size={56} animated={false} />
        <h1 className="font-display text-2xl font-bold text-light-text dark:text-white">
          Something went wrong
        </h1>
        <p className="max-w-md text-light-muted dark:text-dark-muted">
          An unexpected error occurred. Your data is safe — try reloading the page.
        </p>
        <button
          onClick={this.handleReload}
          className="rounded-lg bg-brand-gradient px-6 py-2.5 font-semibold text-white shadow-brand-sm transition hover:shadow-brand"
        >
          Reload Motive
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
