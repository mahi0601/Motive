import React from 'react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SendLinkPanel from './SendLinkPanel';

const LINK = 'https://app.example.test/s/' + 'b'.repeat(64);
const renderPanel = (props = {}) => render(<SendLinkPanel link={LINK} workspaceName="Acme Redesign" canRespond={false} {...props} />);
const text = () => screen.getByLabelText(/message to your client/i);
const originalShare = navigator.share;

describe('SendLinkPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockResolvedValue(undefined) } });
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
  });
  afterEach(() => Object.defineProperty(navigator, 'share', { configurable: true, value: originalShare }));

  test('offers a ready-written message that contains the link and names the project', () => {
    renderPanel();
    expect(screen.getByRole('region', { name: /send it to your client/i })).toBeInTheDocument();
    expect(text().value).toContain(LINK);
    expect(text().value).toContain('Acme Redesign');
  });

  test('typing the client\'s first name greets them by name', () => {
    renderPanel();
    fireEvent.change(screen.getByLabelText(/client's first name/i), { target: { value: 'Ann' } });
    expect(text().value.startsWith('Hi Ann,')).toBe(true);
  });

  test('once the owner has edited the message, changing the name no longer overwrites their words', () => {
    renderPanel();
    fireEvent.change(text(), { target: { value: 'My own words ' + LINK } });
    fireEvent.change(screen.getByLabelText(/client's first name/i), { target: { value: 'Ann' } });
    expect(text().value).toBe('My own words ' + LINK);
  });

  test('Email opens a new message with the text as it is on screen', () => {
    renderPanel();
    fireEvent.change(screen.getByLabelText(/client's first name/i), { target: { value: 'Ann' } });
    const href = screen.getByRole('link', { name: /^email it$/i }).getAttribute('href');
    expect(href.startsWith('mailto:?')).toBe(true);
    const params = new URLSearchParams(href.slice(8));
    expect(params.get('body')).toBe(text().value);
    expect(params.get('subject')).toBe('Acme Redesign: your project status page');
  });

  test('WhatsApp opens with the text as it is on screen, in a new tab that cannot reach back to this page', () => {
    renderPanel();
    fireEvent.change(text(), { target: { value: 'Quick one ' + LINK } });
    const a = screen.getByRole('link', { name: /whatsapp/i });
    expect(a.getAttribute('href')).toBe(`https://wa.me/?text=${encodeURIComponent('Quick one ' + LINK)}`);
    expect(a).toHaveAttribute('target', '_blank');
    expect(a.getAttribute('rel')).toMatch(/noopener/);
  });

  test('Copy message copies exactly what is on screen and says so', async () => {
    renderPanel();
    fireEvent.change(text(), { target: { value: 'Edited ' + LINK } });
    fireEvent.click(screen.getByRole('button', { name: /copy message/i }));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Edited ' + LINK));
    expect(await screen.findByRole('status')).toHaveTextContent(/copied/i);
  });

  test('if copying is not allowed it says how to do it by hand', async () => {
    navigator.clipboard.writeText.mockRejectedValue(new Error('denied'));
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: /copy message/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/select the text and copy/i);
  });

  test('there is no Share button on a device that cannot share (the other ways of sending are still there)', () => {
    renderPanel(); // navigator.share is undefined here
    expect(screen.queryByRole('button', { name: /^share/i })).toBeNull();
    expect(screen.getByRole('link', { name: /^email it$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy message/i })).toBeInTheDocument();
  });

  test('on a device that can share, a Share button shares the text', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: /^share/i }));
    await waitFor(() => expect(share).toHaveBeenCalledWith({ title: 'Acme Redesign: your project status page', text: text().value }));
  });

  test('cancelling the device share sheet is not an error', async () => {
    const abort = Object.assign(new Error('cancelled'), { name: 'AbortError' });
    Object.defineProperty(navigator, 'share', { configurable: true, value: vi.fn().mockRejectedValue(abort) });
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: /^share/i }));
    await waitFor(() => expect(navigator.share).toHaveBeenCalled());
    expect(screen.queryByRole('alert')).toBeNull();
  });

  test('mentions responding only when the page allows it', () => {
    const { unmount } = renderPanel({ canRespond: true });
    expect(text().value).toMatch(/approve|comment/i);
    unmount();
    renderPanel({ canRespond: false });
    expect(text().value).not.toMatch(/approve|comment/i);
  });

  test('keeps nothing: the name is not stored anywhere', () => {
    const before = JSON.stringify({ ...localStorage });
    renderPanel();
    fireEvent.change(screen.getByLabelText(/client's first name/i), { target: { value: 'Ann' } });
    expect(JSON.stringify({ ...localStorage })).toBe(before);
  });

  test('says the link is not shown again, so now is the time to send it', () => {
    renderPanel();
    expect(screen.getByText(/can't be shown again|not be shown again|won.t be shown again/i)).toBeInTheDocument();
  });
});
