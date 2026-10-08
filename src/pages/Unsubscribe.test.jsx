import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Unsubscribe from './Unsubscribe';
import { getUnsubscribeInfo, unsubscribeFromUpdates } from '../services/statusService';

vi.mock('../services/statusService', () => ({ getUnsubscribeInfo: vi.fn(), unsubscribeFromUpdates: vi.fn() }));

const renderIt = () =>
  render(
    <MemoryRouter initialEntries={['/unsubscribe/c_tok']}>
      <Routes><Route path="/unsubscribe/:token" element={<Unsubscribe />} /></Routes>
    </MemoryRouter>
  );

describe('Unsubscribe page', () => {
  beforeEach(() => vi.clearAllMocks());

  test('opening the link changes nothing; only the button unsubscribes', async () => {
    getUnsubscribeInfo.mockResolvedValue({ data: { workspaceName: 'Acme site', unsubscribed: false } });
    unsubscribeFromUpdates.mockResolvedValue({ data: { unsubscribed: true } });
    renderIt();
    expect(await screen.findByText(/weekly email for Acme site/i)).toBeInTheDocument();
    expect(unsubscribeFromUpdates).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Unsubscribe' }));
    await waitFor(() => expect(unsubscribeFromUpdates).toHaveBeenCalledWith('c_tok'));
    expect(await screen.findByText('You are unsubscribed')).toBeInTheDocument();
  });

  test('already unsubscribed shows the confirmation straight away', async () => {
    getUnsubscribeInfo.mockResolvedValue({ data: { workspaceName: 'Acme site', unsubscribed: true } });
    renderIt();
    expect(await screen.findByText('You are unsubscribed')).toBeInTheDocument();
  });

  test('an unknown link says it is not available', async () => {
    getUnsubscribeInfo.mockRejectedValue({ response: { status: 404 } });
    renderIt();
    expect(await screen.findByText('This link is not available')).toBeInTheDocument();
  });

  test('a failed unsubscribe says so and can be retried', async () => {
    getUnsubscribeInfo.mockResolvedValue({ data: { workspaceName: 'Acme', unsubscribed: false } });
    unsubscribeFromUpdates.mockRejectedValue(new Error('boom'));
    renderIt();
    fireEvent.click(await screen.findByRole('button', { name: 'Unsubscribe' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/try again/i);
  });
});
