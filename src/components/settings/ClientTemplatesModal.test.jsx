import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import ClientTemplatesModal from './ClientTemplatesModal';
import { listClientTemplates, deleteClientTemplate, createClientFromTemplate } from '../../services/clientTemplateService';

vi.mock('../../services/clientTemplateService', () => ({ listClientTemplates: vi.fn(), deleteClientTemplate: vi.fn(), createClientFromTemplate: vi.fn() }));

const T1 = { id: 't1', name: 'Website project', description: 'Our standard build', counts: { tasks: 12, pages: 3, milestones: 1 } };
const T2 = { id: 't2', name: 'Retainer', description: '', counts: { tasks: 1, pages: 0, milestones: 2 } };
const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const setup = async (templates = [T1, T2]) => {
  listClientTemplates.mockResolvedValue({ data: { templates } });
  const onClose = vi.fn();
  const onCreated = vi.fn();
  render(<ClientTemplatesModal onClose={onClose} onCreated={onCreated} />);
  if (templates) await screen.findByRole('dialog', { name: /client templates/i });
  return { onClose, onCreated };
};
const item = (name) => screen.getByRole('listitem', { name });

describe('ClientTemplatesModal', () => {
  beforeEach(() => vi.clearAllMocks());

  test('shows a loading state, then each template with what it holds', async () => {
    let resolve;
    listClientTemplates.mockReturnValue(new Promise((r) => { resolve = r; }));
    render(<ClientTemplatesModal onClose={vi.fn()} onCreated={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent(/loading/i);
    await act(async () => resolve({ data: { templates: [T1, T2] } }));
    expect(item('Website project')).toHaveTextContent('Our standard build');
    expect(item('Website project')).toHaveTextContent('12 tasks · 3 pages · 1 milestone');
    expect(item('Retainer')).toHaveTextContent('1 task · 0 pages · 2 milestones');
  });

  test('with no templates it explains how to make one', async () => {
    await setup([]);
    expect(screen.getByText(/no templates yet/i)).toHaveTextContent(/save as client template/i);
    expect(screen.queryByRole('list')).toBeNull();
  });

  test('a failed load says so and Try again loads them', async () => {
    listClientTemplates.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce({ data: { templates: [T1] } });
    render(<ClientTemplatesModal onClose={vi.fn()} onCreated={vi.fn()} />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load/i);
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByRole('listitem', { name: 'Website project' })).toBeInTheDocument();
  });

  describe('starting a client from a template', () => {
    const open = async () => {
      const ctx = await setup();
      fireEvent.click(within(item('Website project')).getByRole('button', { name: /use website project/i }));
      return ctx;
    };
    const create = () => screen.getByRole('button', { name: /create client|creating/i });

    test('asks for a name and start date (today by default), and says what it is made from', async () => {
      await open();
      expect(screen.getByText(/new client from “website project”/i)).toHaveTextContent('12 tasks · 3 pages · 1 milestone');
      expect(screen.getByLabelText(/name of the new client/i).value).toBe('');
      expect(screen.getByLabelText(/start date/i).value).toBe(todayLocal());
    });

    test('a blank name says why and sends nothing', async () => {
      await open();
      fireEvent.click(create());
      expect(screen.getByRole('alert')).toHaveTextContent(/name/i);
      expect(createClientFromTemplate).not.toHaveBeenCalled();
    });

    test('sends the trimmed name and the start date for that template, then hands the result back', async () => {
      createClientFromTemplate.mockResolvedValue({ data: { workspace: { id: 'w2', name: 'Beta Co' }, counts: { tasks: 12, pages: 3, milestones: 1 } } });
      const { onCreated } = await open();
      fireEvent.change(screen.getByLabelText(/name of the new client/i), { target: { value: '  Beta Co ' } });
      fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2027-03-01' } });
      fireEvent.click(create());
      await waitFor(() => expect(onCreated).toHaveBeenCalledWith({ workspace: { id: 'w2', name: 'Beta Co' }, counts: { tasks: 12, pages: 3, milestones: 1 } }));
      expect(createClientFromTemplate).toHaveBeenCalledWith('t1', { name: 'Beta Co', startDate: '2027-03-01' });
    });

    test('uses the template that was chosen, not the first one', async () => {
      createClientFromTemplate.mockResolvedValue({ data: { workspace: { id: 'w3', name: 'C' }, counts: {} } });
      await setup();
      fireEvent.click(within(item('Retainer')).getByRole('button', { name: /use retainer/i }));
      expect(screen.getByText(/new client from “retainer”/i)).toBeInTheDocument();
      fireEvent.change(screen.getByLabelText(/name of the new client/i), { target: { value: 'C' } });
      fireEvent.click(create());
      await waitFor(() => expect(createClientFromTemplate).toHaveBeenCalledTimes(1));
      expect(createClientFromTemplate.mock.calls[0][0]).toBe('t2');
    });

    test('clearing the start date sends none', async () => {
      createClientFromTemplate.mockResolvedValue({ data: { workspace: { id: 'w2', name: 'B' }, counts: {} } });
      await open();
      fireEvent.change(screen.getByLabelText(/name of the new client/i), { target: { value: 'B' } });
      fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '' } });
      fireEvent.click(create());
      await waitFor(() => expect(createClientFromTemplate).toHaveBeenCalled());
      expect(createClientFromTemplate.mock.calls[0][1]).not.toHaveProperty('startDate');
    });

    test('a server refusal is shown, nothing is handed back, and Back returns to the list', async () => {
      createClientFromTemplate.mockRejectedValue({ response: { data: { message: 'Template not found' } } });
      const { onCreated } = await open();
      fireEvent.change(screen.getByLabelText(/name of the new client/i), { target: { value: 'B' } });
      fireEvent.click(create());
      expect(await screen.findByRole('alert')).toHaveTextContent('Template not found');
      expect(onCreated).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole('button', { name: /back to templates/i }));
      expect(screen.getByRole('listitem', { name: 'Retainer' })).toBeInTheDocument();
    });

    test('two clicks before the screen updates still create one client', async () => {
      let resolve;
      createClientFromTemplate.mockReturnValue(new Promise((r) => { resolve = r; }));
      await open();
      fireEvent.change(screen.getByLabelText(/name of the new client/i), { target: { value: 'B' } });
      const button = create();
      act(() => {
        button.click();
        button.click();
      });
      expect(createClientFromTemplate).toHaveBeenCalledTimes(1);
      resolve({ data: { workspace: { id: 'w', name: 'B' }, counts: {} } });
      await waitFor(() => expect(screen.queryByRole('button', { name: /creating/i })).toBeNull());
    });
  });

  describe('deleting a template', () => {
    test('asks first, and nothing is deleted until confirmed; Keep backs out', async () => {
      await setup();
      fireEvent.click(screen.getByRole('button', { name: 'Delete Retainer' }));
      expect(item('Retainer')).toHaveTextContent(/delete this template\?/i);
      expect(deleteClientTemplate).not.toHaveBeenCalled();
      fireEvent.click(within(item('Retainer')).getByRole('button', { name: /keep/i }));
      expect(item('Retainer')).not.toHaveTextContent(/delete this template\?/i);
      expect(deleteClientTemplate).not.toHaveBeenCalled();
    });

    test('confirming deletes that template only and removes it from the list', async () => {
      deleteClientTemplate.mockResolvedValue({ data: { success: true } });
      await setup();
      fireEvent.click(screen.getByRole('button', { name: 'Delete Retainer' }));
      fireEvent.click(screen.getByRole('button', { name: /confirm delete retainer/i }));
      await waitFor(() => expect(screen.queryByRole('listitem', { name: 'Retainer' })).toBeNull());
      expect(deleteClientTemplate).toHaveBeenCalledTimes(1);
      expect(deleteClientTemplate).toHaveBeenCalledWith('t2');
      expect(screen.getByRole('listitem', { name: 'Website project' })).toBeInTheDocument();
    });

    test('a failed delete says so and keeps the template', async () => {
      deleteClientTemplate.mockRejectedValue(new Error('network'));
      await setup();
      fireEvent.click(screen.getByRole('button', { name: 'Delete Retainer' }));
      fireEvent.click(screen.getByRole('button', { name: /confirm delete retainer/i }));
      expect(await screen.findByRole('alert')).toHaveTextContent(/could not delete/i);
      expect(screen.getByRole('listitem', { name: 'Retainer' })).toBeInTheDocument();
    });
  });

  test('Close and Escape close the dialog', async () => {
    const { onClose } = await setup();
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
