import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClientRequestForm from './ClientRequestForm';
import { sendRequest } from '../../services/statusService';

vi.mock('../../services/statusService', () => ({ sendRequest: vi.fn() }));

const fill = (name = 'Ann', title = 'Add a pricing page', details = 'Three tiers.') => {
  fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: name } });
  fireEvent.change(screen.getByLabelText(/what do you need/i), { target: { value: title } });
  fireEvent.change(screen.getByLabelText(/details/i), { target: { value: details } });
};

describe('ClientRequestForm', () => {
  beforeEach(() => vi.clearAllMocks());

  test('sends the request with name, title and details, then confirms', async () => {
    sendRequest.mockResolvedValue({});
    render(<ClientRequestForm token="tok" />);
    fill();
    fireEvent.click(screen.getByRole('button', { name: /send request/i }));
    await waitFor(() => expect(sendRequest).toHaveBeenCalledTimes(1));
    expect(sendRequest).toHaveBeenCalledWith('tok', { name: 'Ann', title: 'Add a pricing page', details: 'Three tiers.', website: '' });
    expect(await screen.findByRole('status')).toHaveTextContent(/thanks/i);
  });

  test('needs a name and a title, and sends nothing without them', () => {
    render(<ClientRequestForm token="tok" />);
    fireEvent.click(screen.getByRole('button', { name: /send request/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/your name/i);
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Ann' } });
    fireEvent.click(screen.getByRole('button', { name: /send request/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/say what you need/i);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  test.each([
    [429, undefined, /too many requests/i],
    [404, undefined, /no longer available/i],
    [422, 'Please say what you need (up to 120 characters).', /up to 120 characters/i],
    [500, undefined, /could not send/i],
  ])('a %i answer shows a plain message', async (status, message, expected) => {
    sendRequest.mockRejectedValue({ response: { status, data: { message } } });
    render(<ClientRequestForm token="tok" />);
    fill();
    fireEvent.click(screen.getByRole('button', { name: /send request/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(expected);
  });

  test('the example page checks the form but sends nothing', async () => {
    render(<ClientRequestForm token="x" demo />);
    fill();
    fireEvent.click(screen.getByRole('button', { name: /send request/i }));
    expect(await screen.findByRole('status')).toHaveTextContent(/thanks/i);
    expect(screen.getByText(/nothing was sent/i)).toBeInTheDocument();
    expect(sendRequest).not.toHaveBeenCalled();
  });

  test('"Send another" brings the form back', async () => {
    sendRequest.mockResolvedValue({});
    render(<ClientRequestForm token="tok" />);
    fill();
    fireEvent.click(screen.getByRole('button', { name: /send request/i }));
    fireEvent.click(await screen.findByRole('button', { name: /send another/i }));
    expect(screen.getByLabelText(/what do you need/i)).toHaveValue('');
  });
});
