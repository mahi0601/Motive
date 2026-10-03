import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Demo from './Demo';
import { getStatus, sendFeedback } from '../services/statusService';

vi.mock('../services/statusService', () => ({ getStatus: vi.fn(), sendFeedback: vi.fn() }));

const renderDemo = () => render(<MemoryRouter><Demo /></MemoryRouter>);

describe('Demo page', () => {
  beforeEach(() => vi.clearAllMocks());

  test('says up front that it is an example with made-up data, and offers to start free', () => {
    renderDemo();
    const note = screen.getByRole('note', { name: /example page/i });
    expect(note).toHaveTextContent(/made-up/i);
    expect(within(note).getByRole('link', { name: /start free/i })).toHaveAttribute('href', '/register');
  });

  test('is the real status page: heading, milestones timeline with an approval, shipped this week, progress and task sections', () => {
    renderDemo();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    const milestones = screen.getByRole('region', { name: /^milestones$/i });
    expect(within(milestones).getAllByRole('listitem').length).toBeGreaterThanOrEqual(3);
    expect(milestones).toHaveTextContent(/approved on/i);
    expect(screen.getByRole('region', { name: /shipped this week/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /shipped each week/i })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /percent of tasks shipped/i })).toBeInTheDocument();
    for (const name of ['Overdue', 'In flight', 'Not started', 'Shipped']) expect(screen.getByRole('region', { name })).toBeInTheDocument();
  });

  test('never calls the server: no status fetch, and the response form sends nothing', () => {
    renderDemo();
    const respond = screen.getByRole('region', { name: /respond/i });
    fireEvent.change(within(respond).getByLabelText(/your name/i), { target: { value: 'Ann' } });
    fireEvent.click(within(respond).getByRole('button', { name: /^approve/i }));
    expect(within(respond).getByRole('status')).toHaveTextContent(/thanks/i);
    expect(within(respond).getByText(/example only/i)).toBeInTheDocument();
    expect(getStatus).not.toHaveBeenCalled();
    expect(sendFeedback).not.toHaveBeenCalled();
  });

  test('the response form still asks for a name, so the example behaves like the real one', () => {
    renderDemo();
    const respond = screen.getByRole('region', { name: /respond/i });
    fireEvent.click(within(respond).getByRole('button', { name: /^approve/i }));
    expect(within(respond).getByRole('alert')).toHaveTextContent(/name/i);
  });

  test('does not claim to refresh itself, since nothing is live', () => {
    renderDemo();
    expect(screen.queryByText(/refreshes automatically/i)).toBeNull();
  });
});
