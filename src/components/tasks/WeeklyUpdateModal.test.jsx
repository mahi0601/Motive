import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WeeklyUpdateModal from './WeeklyUpdateModal';

const WORKSPACE = { id: 'ws-1', name: 'Acme', milestones: [{ id: 'm1', title: 'Design sign-off', date: '2026-12-01T00:00:00.000Z' }] };
const hoursAgo = (h) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
const TASKS = [
  { id: 't1', title: 'Launch banner', status: 'done', completedAt: hoursAgo(5), dueDate: null, description: 'SECRET INTERNAL NOTE' },
  { id: 't2', title: 'Build API', status: 'in_progress', completedAt: null, dueDate: null },
];
const setup = (props = {}) => {
  const onClose = vi.fn();
  render(<WeeklyUpdateModal workspace={WORKSPACE} tasks={TASKS} onClose={onClose} {...props} />);
  return { onClose };
};
const box = () => screen.getByLabelText(/update text/i);

describe('WeeklyUpdateModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });

  test('is a labelled modal that shows the update, built from the workspace\'s tasks and milestones', () => {
    setup();
    const dialog = screen.getByRole('dialog', { name: /weekly update/i });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(box().value).toMatch(/^Acme: weekly update/);
    expect(box().value).toMatch(/Launch banner/);
    expect(box().value).toMatch(/Build API/);
    expect(box().value).toMatch(/Design sign-off \(Dec 1, 2026\)/);
  });

  test('never includes a task description', () => {
    setup();
    expect(box().value).not.toMatch(/SECRET INTERNAL NOTE/);
  });

  test('the text can be edited before it is copied, and what is copied is what is on screen', async () => {
    setup();
    fireEvent.change(box(), { target: { value: 'Hi Ann, quick update:\n- Banner is live' } });
    fireEvent.click(screen.getByRole('button', { name: /copy to clipboard/i }));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Hi Ann, quick update:\n- Banner is live'));
    expect(await screen.findByRole('status')).toHaveTextContent(/copied/i);
  });

  test('if copying is not allowed it says how to do it by hand', async () => {
    navigator.clipboard.writeText.mockRejectedValue(new Error('denied'));
    setup();
    fireEvent.click(screen.getByRole('button', { name: /copy to clipboard/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/select the text and copy/i);
  });

  test('says it is only titles and dates, so the owner knows what they are sharing', () => {
    setup();
    expect(screen.getByText(/titles and dates only/i)).toBeInTheDocument();
  });

  test('says so when nothing has changed', () => {
    setup({ tasks: [] });
    expect(box().value).toMatch(/nothing has changed this week/i);
  });

  test('Escape and the close button close it, and focus moves in when it opens', () => {
    const { onClose } = setup();
    expect(screen.getByRole('dialog')).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: /^close$/i }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
