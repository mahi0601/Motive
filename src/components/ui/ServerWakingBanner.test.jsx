import React from 'react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import ServerWakingBanner from './ServerWakingBanner';
import { requestStarted, requestSettled, resetServerStatus } from '../../services/serverStatus';

describe('ServerWakingBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetServerStatus();
  });
  afterEach(() => vi.useRealTimers());

  test('appears (politely announced) after a slow request and goes away when it answers', () => {
    render(<ServerWakingBanner />);
    expect(screen.queryByRole('status')).toBeNull();

    act(() => {
      requestStarted();
      vi.advanceTimersByTime(4000);
    });
    const banner = screen.getByRole('status');
    expect(banner.textContent).toMatch(/waking up/i);

    act(() => requestSettled());
    expect(screen.queryByRole('status')).toBeNull();
  });
});
