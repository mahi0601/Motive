import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProgressUpdatePanel from './ProgressUpdatePanel';
import { getUpdateSummary } from '../../services/workspaceService';

vi.mock('../../services/workspaceService', () => ({ getUpdateSummary: vi.fn() }));

const SUMMARY = { windowDays: 7, shipped: ['Homepage design'], inProgress: ['Build pages'], upcoming: [], milestone: { title: 'Launch', date: '2026-10-20T00:00:00.000Z' } };
const setup = (props = {}) => render(<ProgressUpdatePanel workspaceId="w1" workspaceName="Acme site" onClose={vi.fn()} {...props} />);

describe('ProgressUpdatePanel', () => {
  beforeEach(() => vi.clearAllMocks());

  test('shows a ready-written, editable update and a WhatsApp link carrying it', async () => {
    getUpdateSummary.mockResolvedValue({ data: { summary: SUMMARY } });
    setup();
    const box = await screen.findByLabelText(/update for your client/i);
    expect(box.value).toContain('• Homepage design');
    expect(box.value).toContain('Next milestone: Launch, Oct 20');
    const wa = screen.getByRole('link', { name: /whatsapp/i });
    expect(wa.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/\?text=/);
    expect(decodeURIComponent(wa.getAttribute('href'))).toContain('Homepage design');
    fireEvent.change(box, { target: { value: 'My own words' } });
    expect(decodeURIComponent(screen.getByRole('link', { name: /whatsapp/i }).getAttribute('href'))).toContain('My own words');
  });

  test('typing the client name puts it in the greeting', async () => {
    getUpdateSummary.mockResolvedValue({ data: { summary: SUMMARY } });
    setup();
    fireEvent.change(await screen.findByLabelText(/first name/i), { target: { value: 'Ann' } });
    expect(screen.getByLabelText(/update for your client/i).value).toMatch(/^Hi Ann,/);
  });

  test('includes the link only when the owner has it', async () => {
    getUpdateSummary.mockResolvedValue({ data: { summary: SUMMARY } });
    setup({ link: 'https://app.test/s/abc' });
    expect((await screen.findByLabelText(/update for your client/i)).value).toContain('https://app.test/s/abc');
  });

  test('copy puts the update on the clipboard', async () => {
    getUpdateSummary.mockResolvedValue({ data: { summary: SUMMARY } });
    const writeText = vi.fn().mockResolvedValue();
    Object.assign(navigator, { clipboard: { writeText } });
    setup();
    await screen.findByLabelText(/update for your client/i);
    fireEvent.click(screen.getByRole('button', { name: /copy update/i }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Homepage design')));
    expect(await screen.findByRole('status')).toHaveTextContent(/copied/i);
  });

  test('a client with nothing done or under way is told what to do (422)', async () => {
    getUpdateSummary.mockRejectedValue({ response: { status: 422, data: { message: 'Nothing finished or in progress yet, so there is nothing to share.' } } });
    setup();
    expect(await screen.findByText(/nothing finished or in progress/i)).toHaveTextContent(/move a task/i);
    expect(screen.queryByLabelText(/update for your client/i)).toBeNull();
  });

  test('a failed load says so', async () => {
    getUpdateSummary.mockRejectedValue(new Error('network'));
    setup();
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not build/i);
  });

  test('Close calls onClose', async () => {
    getUpdateSummary.mockResolvedValue({ data: { summary: SUMMARY } });
    const onClose = vi.fn();
    setup({ onClose });
    await screen.findByLabelText(/update for your client/i);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
