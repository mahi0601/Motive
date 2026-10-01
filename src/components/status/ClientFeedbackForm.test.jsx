import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClientFeedbackForm from './ClientFeedbackForm';
import { sendFeedback } from '../../services/statusService';

vi.mock('../../services/statusService', () => ({ sendFeedback: vi.fn() }));

const renderForm = (props = {}) => render(<ClientFeedbackForm token="tok" milestone={{ title: 'Design sign-off' }} {...props} />);
const fill = (name = 'Ann', message = 'Please make the logo bigger.') => {
  fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: name } });
  fireEvent.change(screen.getByLabelText(/message/i), { target: { value: message } });
};

describe('ClientFeedbackForm', () => {
  beforeEach(() => vi.clearAllMocks());

  test('names the milestone being approved when there is one', () => {
    renderForm();
    expect(screen.getByRole('button', { name: /approve "design sign-off"/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /request changes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send comment/i })).toBeInTheDocument();
  });

  test('falls back to a plain "Approve" with no milestone', () => {
    renderForm({ milestone: null });
    expect(screen.getByRole('button', { name: /^approve$/i })).toBeInTheDocument();
  });

  test('sends a change request with the name and message, then confirms', async () => {
    sendFeedback.mockResolvedValue({});
    renderForm();
    fill();
    fireEvent.click(screen.getByRole('button', { name: /request changes/i }));
    await waitFor(() => expect(sendFeedback).toHaveBeenCalledTimes(1));
    expect(sendFeedback).toHaveBeenCalledWith('tok', { kind: 'changes', name: 'Ann', message: 'Please make the logo bigger.', website: '' });
    expect(await screen.findByRole('status')).toHaveTextContent(/thanks/i);
  });

  test('an approval needs a name but no message', async () => {
    sendFeedback.mockResolvedValue({});
    renderForm();
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Ann' } });
    fireEvent.click(screen.getByRole('button', { name: /approve/i }));
    await waitFor(() => expect(sendFeedback).toHaveBeenCalled());
    expect(sendFeedback.mock.calls[0][1]).toMatchObject({ kind: 'approve', message: '' });
  });

  test('asks for a name, and for a message on comments and change requests, without calling the server', () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: /send comment/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/name/i);
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Ann' } });
    fireEvent.click(screen.getByRole('button', { name: /request changes/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/message/i);
    expect(sendFeedback).not.toHaveBeenCalled();
  });

  test('shows how much of the message is left', () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'x'.repeat(40) } });
    expect(screen.getByText('40 / 1000')).toBeInTheDocument();
  });

  test('the honeypot is out of reach of people and assistive tech, and sent empty', async () => {
    sendFeedback.mockResolvedValue({});
    const { container } = renderForm();
    const trap = container.querySelector('input[name="website"]');
    expect(trap).toBeInTheDocument();
    expect(trap.getAttribute('tabindex')).toBe('-1');
    expect(trap.closest('[aria-hidden="true"]')).not.toBeNull();
    fill();
    fireEvent.click(screen.getByRole('button', { name: /send comment/i }));
    await waitFor(() => expect(sendFeedback).toHaveBeenCalled());
    expect(sendFeedback.mock.calls[0][1].website).toBe('');
  });

  test.each([
    [429, /too many/i],
    [404, /no longer/i],
    [500, /could not send/i],
  ])('a %s from the server gets a clear message and keeps what was typed', async (status, text) => {
    sendFeedback.mockRejectedValue({ response: { status } });
    renderForm();
    fill();
    fireEvent.click(screen.getByRole('button', { name: /send comment/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(text);
    expect(screen.getByLabelText(/message/i).value).toBe('Please make the logo bigger.');
  });

  test('after sending you can send another', async () => {
    sendFeedback.mockResolvedValue({});
    renderForm();
    fill();
    fireEvent.click(screen.getByRole('button', { name: /send comment/i }));
    fireEvent.click(await screen.findByRole('button', { name: /send another/i }));
    expect(screen.getByLabelText(/message/i).value).toBe('');
  });
});
