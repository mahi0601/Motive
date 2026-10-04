import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import Clients from './Clients';
import { getClientsOverview } from '../services/workspaceService';

vi.mock('../services/workspaceService', () => ({ getClientsOverview: vi.fn() }));
const switchWorkspace = vi.fn();
vi.mock('../context/WorkspaceContext', () => ({ useWorkspace: () => ({ switchWorkspace }) }));

const hoursAgo = (h) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
const client = (over = {}) => ({
  id: 'w1', name: 'Alpha', icon: '🚀', linkLive: true, lastViewedAt: hoursAgo(2), open: 5, overdue: 0, shippedThisWeek: 0,
  unreadResponses: 0, nextMilestone: null, attention: [], ...over,
});
const Where = () => <p data-testid="where">{useLocation().pathname}</p>;
const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/clients']}>
      <Routes>
        <Route path="/clients" element={<Clients />} />
        <Route path="/dashboard" element={<Where />} />
        <Route path="/settings" element={<Where />} />
      </Routes>
    </MemoryRouter>
  );
const list = () => screen.findByRole('list', { name: /clients/i });

describe('Clients', () => {
  beforeEach(() => vi.clearAllMocks());

  test('shows a loading state, then the clients in the order the server gave them', async () => {
    // The server puts the most urgent first, which is not alphabetical: the page must keep that order.
    getClientsOverview.mockResolvedValue({ data: { clients: [client({ id: 'z', name: 'Zed', attention: ['overdue'], overdue: 2 }), client({ id: 'a', name: 'Alpha' }), client({ id: 'b', name: 'Beta' })] } });
    renderPage();
    expect(screen.getByRole('status')).toHaveTextContent(/loading/i);
    const items = within(await list()).getAllByRole('listitem');
    expect(items.map((li) => li.querySelector('h2').textContent)).toEqual(['Zed', 'Alpha', 'Beta']);
  });

  test('says how many clients need attention', async () => {
    getClientsOverview.mockResolvedValue({ data: { clients: [client({ attention: ['overdue'], overdue: 1 }), client({ id: 'b', name: 'Beta' }), client({ id: 'c', name: 'Gamma', attention: ['quiet'] })] } });
    renderPage();
    await list();
    expect(screen.getByText(/2 of 3 clients need attention/i)).toBeInTheDocument();
  });

  test('says when nobody needs attention', async () => {
    getClientsOverview.mockResolvedValue({ data: { clients: [client(), client({ id: 'b', name: 'Beta' })] } });
    renderPage();
    await list();
    expect(screen.getByText(/no client needs attention/i)).toBeInTheDocument();
  });

  describe('each client', () => {
    test('says in words why it needs a look, not only with a colour', async () => {
      getClientsOverview.mockResolvedValue({
        data: { clients: [client({ overdue: 2, unreadResponses: 1, attention: ['overdue', 'responses', 'not_opened'], lastViewedAt: null })] },
      });
      renderPage();
      const item = within(await list()).getByRole('listitem');
      expect(item).toHaveTextContent('2 tasks overdue');
      expect(item).toHaveTextContent('1 unread reply');
      expect(item).toHaveTextContent(/link is live but has not been opened/i);
    });

    test('a client that went quiet says so', async () => {
      getClientsOverview.mockResolvedValue({ data: { clients: [client({ attention: ['quiet'], lastViewedAt: hoursAgo(24 * 20) })] } });
      renderPage();
      expect(within(await list()).getByRole('listitem')).toHaveTextContent(/not opened in over 2 weeks/i);
    });

    test('shows last opened, the link state and the week\'s numbers', async () => {
      getClientsOverview.mockResolvedValue({ data: { clients: [client({ shippedThisWeek: 3, overdue: 0, open: 7 })] } });
      renderPage();
      const item = within(await list()).getByRole('listitem');
      expect(item).toHaveTextContent('Live link');
      expect(item).toHaveTextContent('Last opened 2 hours ago');
      expect(item).toHaveTextContent('3 shipped this week');
      expect(item).toHaveTextContent('7 open');
    });

    test('a client with no link says so and shows no last-opened line', async () => {
      getClientsOverview.mockResolvedValue({ data: { clients: [client({ linkLive: false, lastViewedAt: null })] } });
      renderPage();
      const item = within(await list()).getByRole('listitem');
      expect(item).toHaveTextContent('No link yet');
      expect(item).not.toHaveTextContent(/last opened|not been opened/i);
    });

    test('shows the next milestone with its date', async () => {
      getClientsOverview.mockResolvedValue({ data: { clients: [client({ nextMilestone: { title: 'Launch', date: '2026-12-01T00:00:00.000Z' } })] } });
      renderPage();
      expect(within(await list()).getByRole('listitem')).toHaveTextContent(/next milestone: launch/i);
    });

    test('a healthy client has no attention line at all', async () => {
      getClientsOverview.mockResolvedValue({ data: { clients: [client()] } });
      renderPage();
      expect(within(await list()).getByRole('listitem')).not.toHaveTextContent(/needs attention/i);
    });

    test('a client name is shown as text, never markup', async () => {
      getClientsOverview.mockResolvedValue({ data: { clients: [client({ name: '<img src=x onerror=alert(1)>' })] } });
      renderPage();
      const l = await list();
      expect(l).toHaveTextContent('<img src=x onerror=alert(1)>');
      expect(l.querySelector('img')).toBeNull();
    });
  });

  describe('opening a client', () => {
    test('switches to that workspace and goes to its board', async () => {
      getClientsOverview.mockResolvedValue({ data: { clients: [client({ id: 'a', name: 'Alpha' }), client({ id: 'b', name: 'Beta' })] } });
      renderPage();
      fireEvent.click(await screen.findByRole('button', { name: /open beta/i }));
      expect(switchWorkspace).toHaveBeenCalledWith('b');
      expect(await screen.findByTestId('where')).toHaveTextContent('/dashboard');
    });

    test('is a real button, so the keyboard can use it', async () => {
      getClientsOverview.mockResolvedValue({ data: { clients: [client()] } });
      renderPage();
      expect((await screen.findByRole('button', { name: /open alpha/i })).tagName).toBe('BUTTON');
    });
  });

  describe('when there is nothing to show', () => {
    test('no clients: says so and points at Settings', async () => {
      getClientsOverview.mockResolvedValue({ data: { clients: [] } });
      renderPage();
      expect(await screen.findByText(/you have no clients yet/i)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('link', { name: /go to settings/i }));
      expect(await screen.findByTestId('where')).toHaveTextContent('/settings');
    });

    test('a single client is shown, with a hint that more can be added', async () => {
      getClientsOverview.mockResolvedValue({ data: { clients: [client()] } });
      renderPage();
      await list();
      expect(screen.getByText(/only one client so far/i)).toBeInTheDocument();
    });

    test('a failure says so and can be retried', async () => {
      getClientsOverview.mockRejectedValueOnce(new Error('offline'));
      getClientsOverview.mockResolvedValueOnce({ data: { clients: [client()] } });
      renderPage();
      expect(await screen.findByRole('alert')).toHaveTextContent(/could not load/i);
      fireEvent.click(screen.getByRole('button', { name: /try again/i }));
      expect(await list()).toBeInTheDocument();
      expect(getClientsOverview).toHaveBeenCalledTimes(2);
    });

    test('Refresh asks again', async () => {
      getClientsOverview.mockResolvedValue({ data: { clients: [client()] } });
      renderPage();
      await list();
      fireEvent.click(screen.getByRole('button', { name: /refresh/i }));
      await waitFor(() => expect(getClientsOverview).toHaveBeenCalledTimes(2));
    });
  });
});
