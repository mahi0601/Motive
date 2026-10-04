import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import SaveClientTemplateModal from './SaveClientTemplateModal';
import { saveClientTemplate } from '../../services/clientTemplateService';

vi.mock('../../services/clientTemplateService', () => ({ saveClientTemplate: vi.fn() }));

const WORKSPACE = { id: 'ws-1', name: 'Acme Redesign' };
const setup = () => {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  render(<SaveClientTemplateModal workspace={WORKSPACE} onClose={onClose} onSaved={onSaved} />);
  return { onClose, onSaved };
};
const name = () => screen.getByLabelText(/template name/i);
const save = () => screen.getByRole('button', { name: /save template|saving/i });

describe('SaveClientTemplateModal', () => {
  beforeEach(() => vi.clearAllMocks());

  test('is a labelled dialog that takes focus, with the client name as the starting template name', () => {
    setup();
    const dialog = screen.getByRole('dialog', { name: /save as client template/i });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveFocus();
    expect(name().value).toBe('Acme Redesign');
    expect(name()).toHaveAttribute('maxlength', '100');
    expect(screen.getByLabelText(/description/i)).toHaveAttribute('maxlength', '300');
  });

  test('says plainly what is not saved', () => {
    setup();
    const note = screen.getByText(/not saved/i);
    for (const word of [/comments/i, /files/i, /images/i, /people/i, /sign-offs/i, /status link/i]) expect(note).toHaveTextContent(word);
  });

  test('a blank name says why and sends nothing', () => {
    setup();
    fireEvent.change(name(), { target: { value: '   ' } });
    fireEvent.click(save());
    expect(screen.getByRole('alert')).toHaveTextContent(/name/i);
    expect(saveClientTemplate).not.toHaveBeenCalled();
  });

  test('sends the workspace, the trimmed name and description, then hands the template back', async () => {
    saveClientTemplate.mockResolvedValue({ data: { template: { id: 't1', name: 'Website project' } } });
    const { onSaved } = setup();
    fireEvent.change(name(), { target: { value: '  Website project ' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: ' Our standard build ' } });
    fireEvent.click(save());
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith({ id: 't1', name: 'Website project' }));
    expect(saveClientTemplate).toHaveBeenCalledWith({ workspaceId: 'ws-1', name: 'Website project', description: 'Our standard build' });
  });

  test('shows the reason from the server and keeps the dialog open', async () => {
    saveClientTemplate.mockRejectedValue({ response: { data: { message: 'You can keep up to 20 client templates.' } } });
    const { onSaved, onClose } = setup();
    fireEvent.click(save());
    expect(await screen.findByRole('alert')).toHaveTextContent('You can keep up to 20 client templates. Nothing was saved.');
    expect(onSaved).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(save()).not.toBeDisabled();
  });

  test('a failure without a reason still says nothing was saved', async () => {
    saveClientTemplate.mockRejectedValue(new Error('network'));
    setup();
    fireEvent.click(save());
    expect(await screen.findByRole('alert')).toHaveTextContent(/nothing was saved/i);
  });

  test('two clicks before the screen updates still save once', async () => {
    let resolve;
    saveClientTemplate.mockReturnValue(new Promise((r) => { resolve = r; }));
    setup();
    const button = save();
    act(() => {
      button.click();
      button.click();
    });
    expect(saveClientTemplate).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    resolve({ data: { template: { id: 't', name: 'x' } } });
    await waitFor(() => expect(screen.queryByRole('button', { name: /saving/i })).toBeNull());
  });

  test('Escape closes it, but not while it is saving', async () => {
    let resolve;
    saveClientTemplate.mockReturnValue(new Promise((r) => { resolve = r; }));
    const { onClose } = setup();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(save());
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    resolve({ data: { template: { id: 't', name: 'x' } } });
    await waitFor(() => expect(screen.queryByRole('button', { name: /saving/i })).toBeNull());
  });
});
