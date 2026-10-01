import React, { Suspense } from 'react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { lazyWithRetry } from './lazyWithRetry';

// After a deploy, the hashed chunk files an open tab points at no longer exist,
// so the dynamic import fails and the screen would stay blank. One automatic
// reload fetches the new index.html and its chunks; a second failure in a row is
// a real error and must surface (not loop forever).
describe('lazyWithRetry', () => {
  const original = window.location;
  let reload;
  beforeEach(() => {
    sessionStorage.clear();
    reload = vi.fn();
    Object.defineProperty(window, 'location', { configurable: true, value: { ...original, reload } });
  });
  afterEach(() => Object.defineProperty(window, 'location', { configurable: true, value: original }));

  test('renders the module when the import works', async () => {
    const Lazy = lazyWithRetry(() => Promise.resolve({ default: () => <p>loaded</p> }));
    render(<Suspense fallback="wait"><Lazy /></Suspense>);
    expect(await screen.findByText('loaded')).toBeTruthy();
    expect(reload).not.toHaveBeenCalled();
  });

  test('reloads the page once when the chunk fails to load', async () => {
    const Lazy = lazyWithRetry(() => Promise.reject(new Error('Failed to fetch dynamically imported module')));
    render(<Suspense fallback="wait"><Lazy /></Suspense>);
    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
  });

  test('does not reload in a loop: a failure right after a reload is thrown', async () => {
    sessionStorage.setItem('motive:chunk-reload', '1');
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    class Catch extends React.Component {
      state = { err: null };
      static getDerivedStateFromError(err) { return { err }; }
      render() { return this.state.err ? <p>{this.state.err.message}</p> : this.props.children; }
    }
    const Lazy = lazyWithRetry(() => Promise.reject(new Error('still broken')));
    render(<Catch><Suspense fallback="wait"><Lazy /></Suspense></Catch>);
    expect(await screen.findByText('still broken')).toBeTruthy();
    expect(reload).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  test('a successful load clears the guard so a later deploy can retry again', async () => {
    sessionStorage.setItem('motive:chunk-reload', '1');
    const Lazy = lazyWithRetry(() => Promise.resolve({ default: () => <p>ok</p> }));
    render(<Suspense fallback="wait"><Lazy /></Suspense>);
    await screen.findByText('ok');
    expect(sessionStorage.getItem('motive:chunk-reload')).toBeNull();
  });
});
