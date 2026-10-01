import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { requestStarted, requestSettled, isWaking, subscribe, resetServerStatus } from './serverStatus';

// A free-tier API sleeps when idle and takes up to a minute to wake. The UI
// needs to know "a request has been pending suspiciously long" so it can say so
// instead of looking frozen — without crying wolf on ordinary requests.
describe('serverStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetServerStatus();
  });
  afterEach(() => vi.useRealTimers());

  test('is not waking for a request that finishes quickly', () => {
    requestStarted();
    vi.advanceTimersByTime(1000);
    requestSettled();
    vi.advanceTimersByTime(10_000);
    expect(isWaking()).toBe(false);
  });

  test('turns on when a request has been pending past the threshold', () => {
    requestStarted();
    vi.advanceTimersByTime(3000);
    expect(isWaking()).toBe(false);
    vi.advanceTimersByTime(1000);
    expect(isWaking()).toBe(true);
  });

  test('turns off as soon as any response arrives', () => {
    requestStarted();
    vi.advanceTimersByTime(5000);
    expect(isWaking()).toBe(true);
    requestSettled();
    expect(isWaking()).toBe(false);
  });

  test('keeps counting for the requests still pending after one settles', () => {
    requestStarted();
    requestStarted();
    vi.advanceTimersByTime(5000);
    requestSettled(); // one answered, one still pending
    expect(isWaking()).toBe(false);
    vi.advanceTimersByTime(4000);
    expect(isWaking()).toBe(true);
  });

  test('never goes negative when settled more often than started', () => {
    requestSettled();
    requestSettled();
    requestStarted();
    vi.advanceTimersByTime(4000);
    expect(isWaking()).toBe(true);
  });

  test('notifies subscribers only when the value changes', () => {
    const fn = vi.fn();
    const off = subscribe(fn);
    requestStarted();
    vi.advanceTimersByTime(4000);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(5000);
    expect(fn).toHaveBeenCalledTimes(1);
    requestSettled();
    expect(fn).toHaveBeenCalledTimes(2);
    off();
    requestStarted();
    vi.advanceTimersByTime(4000);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
