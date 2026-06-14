import React from 'react';
import { LogoMark } from './Logo';

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
    // In production this is where you'd forward to Sentry/LogRocket/etc.
    console.error('Uncaught UI error:', error, info?.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.assign('/');
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-white px-6 text-center dark:bg-[#0e0d12]">
        <LogoMark size={56} animated={false} />
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
          Something went wrong
        </h1>
        <p className="max-w-md text-gray-500 dark:text-gray-400">
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
