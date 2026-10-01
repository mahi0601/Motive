import React, { useSyncExternalStore } from 'react';
import { subscribe, isWaking } from '../../services/serverStatus';

// Shown only while a request has been pending unusually long. Says what is
// happening instead of leaving a spinner that looks frozen.
const ServerWakingBanner = () => {
  const waking = useSyncExternalStore(subscribe, isWaking);
  if (!waking) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[100] flex justify-center px-4 pt-3 pointer-events-none"
    >
      <p className="pointer-events-auto max-w-md rounded-lg border border-light-border bg-light-surface px-4 py-2 text-sm text-light-text shadow-lg dark:border-dark-border dark:bg-dark-raised dark:text-dark-text">
        Waking up the server — after a quiet spell this can take up to a minute. Thanks for waiting.
      </p>
    </div>
  );
};

export default ServerWakingBanner;
