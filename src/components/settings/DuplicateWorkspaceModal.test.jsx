import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import DuplicateWorkspaceModal from './DuplicateWorkspaceModal';
import { duplicateWorkspace } from '../../services/workspaceService';

vi.mock('../../services/workspaceService', () => ({ duplicateWorkspace: vi.fn() }));

const WORKSPACE = { id: 'ws-1', name: 'Acme Redesign' };
const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const setup = () => {
  const onClose = vi.fn();
  const onCreated = vi.fn();
  render(<DuplicateWorkspaceModal workspace={WORKSPACE} onClose={onClose} onCreated={onCreated} />);
  return { onClose, onCreated };
};
const name = () => screen.getByLabelText(/name of the new client/i);
const create = () => screen.getByRole('button', { name: /create (new )?client|creating/i });

describe('DuplicateWorkspaceModal', () => {
  beforeEach(() => vi.clearAllMocks());

  test('is a labelled dialog that says what it is copying from', () => {
    setup();
    const dialog = screen.getByRole('dialog', { name: /new client from this one/i });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveTextContent('Acme Redesign');
    expect(dialog).toHaveFocus();
  });

  test('starts with everything switched on, the start date as today, and an empty name to fill in', () => {
    setup();
    expect(name().value).toBe('');
    expect(name()).toHaveAttribute('maxlength', '100');
    expect(screen.getByLabelText(/start date/i).value).toBe(todayLocal());
    for (const label of [/tasks/i, /pages/i, /milestones/i, /status page wording/i]) expect(screen.getByRole('checkbox', { name: label })).toBeChecked();
  });

  test('says plainly what is not copied, so nothing confidential is a surprise', () => {
    setup();
    const note = screen.getByText(/not copied/i);
    for (const word of [/comments/i, /files/i, /images/i, /people/i, /sign-offs/i, /status link/i]) expect(note).toHaveTextContent(word);
  });

  test('explains how the start date is used', () => {
    setup();
    expect(screen.getByText(/earliest date/i)).toBeInTheDocument();
  });

  test('asking for a copy without a name says why and sends nothing', () => {
    setup();
    fireEvent.click(create());
    expect(screen.getByRole('alert')).toHaveTextContent(/name/i);
    expect(duplicateWorkspace).not.toHaveBeenCalled();
  });

  test('sends the name (trimmed), the start date and what to include, then hands the result back', async () => {
    duplicateWorkspace.mockResolvedValue({ data: { success: true, workspace: { id: 'ws-2', name: 'Beta Co' }, counts: { tasks: 3, pages: 2, milestones: 2 } } });
    const { onCreated } = setup();
    fireEvent.change(name(), { target: { value: '  Beta Co  ' } });
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2027-03-01' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /milestones/i }));
    fireEvent.click(create());
    await waitFor(() => expect(duplicateWorkspace).toHaveBeenCalledTimes(1));
    expect(duplicateWorkspace).toHaveBeenCalledWith('ws-1', {
      name: 'Beta Co',
      startDate: '2027-03-01',
      include: { tasks: true, pages: true, milestones: false, statusText: true },
    });
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith({ workspace: { id: 'ws-2', name: 'Beta Co' }, counts: { tasks: 3, pages: 2, milestones: 2 } }));
  });

  test('clearing the start date sends none, which drops the dates instead of guessing', async () => {
    duplicateWorkspace.mockResolvedValue({ data: { workspace: { id: 'ws-2', name: 'B' }, counts: {} } });
    setup();
    fireEvent.change(name(), { target: { value: 'B' } });
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '' } });
    fireEvent.click(create());
    await waitFor(() => expect(duplicateWorkspace).toHaveBeenCalled());
    expect(duplicateWorkspace.mock.calls[0][1]).not.toHaveProperty('startDate');
  });

  test('two clicks before the screen updates still make one copy', async () => {
    let resolve;
    duplicateWorkspace.mockReturnValue(new Promise((r) => { resolve = r; }));
    setup();
    fireEvent.change(name(), { target: { value: 'B' } });
    const button = create();
    act(() => {
      button.click();
      button.click();
    });
    expect(duplicateWorkspace).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();
    resolve({ data: { workspace: { id: 'ws-2', name: 'B' }, counts: {} } });
    await waitFor(() => expect(screen.queryByRole('button', { name: /creating/i })).toBeNull());
  });

  test('Escape does not close it while it is working', async () => {
    let resolve;
    duplicateWorkspace.mockReturnValue(new Promise((r) => { resolve = r; }));
    const { onClose } = setup();
    fireEvent.change(name(), { target: { value: 'B' } });
    fireEvent.click(create());
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
    resolve({ data: { workspace: { id: 'ws-2', name: 'B' }, counts: {} } });
    await waitFor(() => expect(screen.queryByRole('button', { name: /creating/i })).toBeNull());
  });

  test('Escape and the close button close it when it is idle', () => {
    const { onClose } = setup();
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: /^close$/i }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  test('a refusal shows the server\'s reason, says nothing was created, and the form can be tried again', async () => {
    duplicateWorkspace.mockRejectedValue({ response: { status: 422, data: { message: 'This project has 600 tasks and up to 500 tasks can be copied. Leave tasks out, or archive some first.' } } });
    const { onCreated } = setup();
    fireEvent.change(name(), { target: { value: 'B' } });
    fireEvent.click(create());
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/600 tasks/);
    expect(alert).toHaveTextContent(/nothing was created/i);
    expect(onCreated).not.toHaveBeenCalled();
    expect(create()).not.toBeDisabled();
  });

  test('too many copies and a network failure each get a plain message', async () => {
    duplicateWorkspace.mockRejectedValueOnce({ response: { status: 429, data: { message: 'Too many copies, try again later.' } } });
    setup();
    fireEvent.change(name(), { target: { value: 'B' } });
    fireEvent.click(create());
    expect(await screen.findByRole('alert')).toHaveTextContent(/too many copies/i);
    duplicateWorkspace.mockRejectedValueOnce(new Error('Network Error'));
    fireEvent.click(create());
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/could not create/i));
  });
});
