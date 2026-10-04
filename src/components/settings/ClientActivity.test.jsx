import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import ClientActivity from './ClientActivity';
import { getEngagement } from '../../services/workspaceService';

vi.mock('../../services/workspaceService', () => ({ getEngagement: vi.fn() }));

const hoursAgo = (h) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
const renderIt = (props = {}) => render(<ClientActivity workspaceId="ws-1" {...props} />);
const region = () => screen.findByRole('region', { name: /client activity/i });

describe('ClientActivity', () => {
  beforeEach(() => vi.clearAllMocks());

  test('says when the page was last opened and how many visits it had this week', async () => {
    getEngagement.mockResolvedValue({ data: { success: true, lastViewedAt: hoursAgo(2), views7d: 9, visits7d: 3 } });
    renderIt();
    const r = await region();
    expect(r).toHaveTextContent('Last opened 2 hours ago');
    expect(r).toHaveTextContent('3 visits in the last 7 days');
    expect(getEngagement).toHaveBeenCalledWith('ws-1');
  });

  test('one visit reads naturally', async () => {
    getEngagement.mockResolvedValue({ data: { lastViewedAt: hoursAgo(1), views7d: 1, visits7d: 1 } });
    renderIt();
    expect(await region()).toHaveTextContent('1 visit in the last 7 days');
  });

  test('a page nobody has opened says so and tells the owner what to do, instead of showing zeros', async () => {
    getEngagement.mockResolvedValue({ data: { lastViewedAt: null, views7d: 0, visits7d: 0 } });
    renderIt();
    const r = await region();
    expect(r).toHaveTextContent(/not opened yet/i);
    expect(r).toHaveTextContent(/send your client the link/i);
    expect(r).not.toHaveTextContent(/0 visits/i);
  });

  test('opened before, but not this week: the last time is shown and the week says none', async () => {
    getEngagement.mockResolvedValue({ data: { lastViewedAt: hoursAgo(24 * 12), views7d: 0, visits7d: 0 } });
    renderIt();
    const r = await region();
    expect(r).toHaveTextContent(/last opened on/i);
    expect(r).toHaveTextContent(/no visits in the last 7 days/i);
  });

  test('says what is not counted, so the numbers are trusted', async () => {
    getEngagement.mockResolvedValue({ data: { lastViewedAt: hoursAgo(1), views7d: 1, visits7d: 1 } });
    renderIt();
    expect(await region()).toHaveTextContent(/your own preview and link previews are not counted/i);
  });

  test('shows nothing while loading, and nothing if it cannot be loaded (it is a nicety, not a control)', async () => {
    getEngagement.mockReturnValue(new Promise(() => {}));
    const { container, unmount } = renderIt();
    expect(container).toBeEmptyDOMElement();
    unmount();
    getEngagement.mockRejectedValue(new Error('offline'));
    const second = renderIt();
    await waitFor(() => expect(getEngagement).toHaveBeenCalledTimes(2));
    expect(second.container).toBeEmptyDOMElement();
  });

  test('asks again when the workspace changes, and ignores an answer that arrives for the old one', async () => {
    let resolveOld;
    getEngagement.mockImplementationOnce(() => new Promise((r) => { resolveOld = r; }));
    getEngagement.mockResolvedValueOnce({ data: { lastViewedAt: hoursAgo(3), views7d: 2, visits7d: 2 } });
    const { rerender } = renderIt({ workspaceId: 'old' });
    rerender(<ClientActivity workspaceId="new" />);
    expect(await region()).toHaveTextContent('2 visits');
    // The old workspace's answer arrives late; give React every chance to apply it.
    await act(async () => {
      resolveOld({ data: { lastViewedAt: hoursAgo(1), views7d: 99, visits7d: 99 } });
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(screen.getByRole('region', { name: /client activity/i })).toHaveTextContent('2 visits');
    expect(screen.getByRole('region', { name: /client activity/i })).not.toHaveTextContent('99');
  });
});
