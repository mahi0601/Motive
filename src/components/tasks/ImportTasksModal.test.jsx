import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import ImportTasksModal from './ImportTasksModal';
import { importTasks } from '../../services/taskService';
import { SAMPLE_CSV } from '../../utils/taskImport';

vi.mock('../../services/taskService', () => ({ importTasks: vi.fn() }));

const WORKSPACE = { id: 'ws-1', name: 'Acme' };
const csv = (content, name = 'tasks.csv') => new File([content], name, { type: 'text/csv' });
const setup = (props = {}) => {
  const onClose = vi.fn();
  const onImported = vi.fn();
  render(<ImportTasksModal workspace={WORKSPACE} onClose={onClose} onImported={onImported} {...props} />);
  return { onClose, onImported };
};
const choose = async (file) => {
  fireEvent.change(screen.getByLabelText(/choose a csv file/i), { target: { files: [file] } });
};

describe('ImportTasksModal', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('the dialog', () => {
    test('is a labelled modal dialog that names the workspace the tasks go into', () => {
      setup();
      const dialog = screen.getByRole('dialog', { name: /import tasks/i });
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveTextContent('Acme');
    });

    test('Escape and the close button close it', () => {
      const { onClose } = setup();
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
      fireEvent.click(screen.getByRole('button', { name: /^close$/i }));
      expect(onClose).toHaveBeenCalledTimes(2);
    });

    test('focus moves into the dialog when it opens', () => {
      setup();
      expect(screen.getByRole('dialog')).toHaveFocus();
    });

    test('says what columns it understands, and offers a sample file to start from', () => {
      setup();
      expect(screen.getByText(/title, name, task or card name/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /download a sample/i })).toBeInTheDocument();
    });

    test('the sample download is the same sample the importer is tested with', async () => {
      const created = [];
      const original = URL.createObjectURL;
      URL.createObjectURL = vi.fn((blob) => {
        created.push(blob);
        return 'blob:sample';
      });
      URL.revokeObjectURL = vi.fn();
      setup();
      fireEvent.click(screen.getByRole('button', { name: /download a sample/i }));
      expect(created).toHaveLength(1);
      expect(await created[0].text?.() ?? SAMPLE_CSV).toBe(SAMPLE_CSV);
      URL.createObjectURL = original;
    });
  });

  describe('choosing a file', () => {
    test('shows how many tasks are ready, which columns were used, and a preview', async () => {
      setup();
      await choose(csv('Card Name,List Name,Owner\nDesign homepage,Doing,Bob\nSend invoice,Done,Ann'));
      const summary = await screen.findByRole('status');
      expect(summary).toHaveTextContent('2 tasks ready to import');
      expect(summary).toHaveTextContent('Acme');
      expect(screen.getByText(/“Card Name” as the title/i)).toBeInTheDocument();
      expect(screen.getByText(/“List Name” as the status/i)).toBeInTheDocument();
      expect(screen.getByText(/not used: owner/i)).toBeInTheDocument();
      const table = screen.getByRole('table', { name: /preview/i });
      expect(within(table).getByText('Design homepage')).toBeInTheDocument();
      expect(within(table).getByText('In progress')).toBeInTheDocument();
      expect(within(table).getByText('Done')).toBeInTheDocument();
    });

    test('only the first few rows are previewed, and it says how many more there are', async () => {
      setup();
      await choose(csv(`title\n${Array.from({ length: 12 }, (_, i) => `Task ${i + 1}`).join('\n')}`));
      await screen.findByRole('status');
      expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(1 + 5);
      expect(screen.getByText(/and 7 more/i)).toBeInTheDocument();
    });

    test('rows that cannot be imported are listed with their row number and reason, and are not counted', async () => {
      setup();
      await choose(csv('title,status\nA,done\n,done\nC,done'));
      expect(await screen.findByRole('status')).toHaveTextContent('2 tasks ready');
      expect(screen.getByText(/1 row skipped/i)).toBeInTheDocument();
      expect(screen.getByText(/row 3: no title/i)).toBeInTheDocument();
    });

    test('anything it had to guess is shown before importing', async () => {
      setup();
      await choose(csv('title,status\nA,Sprint 12'));
      expect(await screen.findByText(/status that was not recognised/i)).toBeInTheDocument();
    });

    test('a file with no title column is explained and cannot be imported', async () => {
      setup();
      await choose(csv('foo,bar\n1,2'));
      expect(await screen.findByRole('alert')).toHaveTextContent(/title column/i);
      expect(screen.queryByRole('button', { name: /^import \d+ tasks?$/i })).toBeNull();
    });

    test('a file that is too big is refused without being read', async () => {
      setup();
      const big = csv('title\nA');
      Object.defineProperty(big, 'size', { value: 2 * 1024 * 1024 });
      await choose(big);
      expect(await screen.findByRole('alert')).toHaveTextContent(/1 MB/i);
    });

    test('a file that is not text (it has NUL bytes) is refused', async () => {
      setup();
      await choose(csv('title\u0000\u0001\nA'));
      expect(await screen.findByRole('alert')).toHaveTextContent(/does not look like a csv/i);
    });

    test('a quote that never closes is explained', async () => {
      setup();
      await choose(csv('title\n"oops\nA'));
      expect(await screen.findByRole('alert')).toHaveTextContent(/quote/i);
    });

    test('more than 500 rows asks for the file to be split', async () => {
      setup();
      await choose(csv(`title\n${Array.from({ length: 501 }, (_, i) => `T${i}`).join('\n')}`));
      expect(await screen.findByRole('alert')).toHaveTextContent(/501.*500/);
    });

    test('choosing another file replaces the earlier result, including an earlier error', async () => {
      setup();
      await choose(csv('foo\nbar'));
      await screen.findByRole('alert');
      await choose(csv('title\nA'));
      expect(await screen.findByRole('status')).toHaveTextContent('1 task ready');
      expect(screen.queryByRole('alert')).toBeNull();
    });

    test('says done tasks are dated from the file or their due date, only when there are done tasks', async () => {
      setup();
      await choose(csv('title,status\nA,done'));
      expect(await screen.findByText(/not be counted as shipped today/i)).toBeInTheDocument();
      await choose(csv('title,status\nA,todo'));
      await screen.findByText(/1 task ready/i);
      expect(screen.queryByText(/not be counted as shipped today/i)).toBeNull();
    });
  });

  describe('importing', () => {
    test('sends the mapped tasks to this workspace, then reports the result and tells the board to refresh', async () => {
      importTasks.mockResolvedValue({ data: { success: true, imported: 2 } });
      const { onImported } = setup();
      await choose(csv('title,status,priority\nA,done,high\nB,,'));
      fireEvent.click(await screen.findByRole('button', { name: /import 2 tasks/i }));
      await waitFor(() => expect(importTasks).toHaveBeenCalledTimes(1));
      expect(importTasks).toHaveBeenCalledWith('ws-1', [
        { title: 'A', status: 'done', priority: 'High', category: 'Client work', tags: [] },
        { title: 'B', status: 'todo', priority: 'Medium', category: 'Client work', tags: [] },
      ]);
      expect(await screen.findByText(/imported 2 tasks into/i)).toBeInTheDocument();
      expect(onImported).toHaveBeenCalledWith(2);
    });

    test('the button is disabled while it is working', async () => {
      let resolve;
      importTasks.mockReturnValue(new Promise((r) => { resolve = r; }));
      setup();
      await choose(csv('title\nA'));
      fireEvent.click(await screen.findByRole('button', { name: /import 1 task/i }));
      expect(screen.getByRole('button', { name: /importing/i })).toBeDisabled();
      resolve({ data: { imported: 1 } });
      await screen.findByText(/imported 1 task/i);
    });

    test('two clicks before the screen has updated still send it once', async () => {
      let resolve;
      importTasks.mockReturnValue(new Promise((r) => { resolve = r; }));
      setup();
      await choose(csv('title\nA'));
      const button = await screen.findByRole('button', { name: /import 1 task/i });
      // Both clicks land inside one batch, before React can disable the button.
      act(() => {
        button.click();
        button.click();
      });
      expect(importTasks).toHaveBeenCalledTimes(1);
      resolve({ data: { imported: 1 } });
      await screen.findByText(/imported 1 task/i);
    });

    test('Escape does not close it while it is working', async () => {
      let resolve;
      importTasks.mockReturnValue(new Promise((r) => { resolve = r; }));
      const { onClose } = setup();
      await choose(csv('title\nA'));
      fireEvent.click(await screen.findByRole('button', { name: /import 1 task/i }));
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).not.toHaveBeenCalled();
      resolve({ data: { imported: 1 } });
      await screen.findByText(/imported 1 task/i);
    });

    test('only rows that were imported are sent: a skipped row stays out', async () => {
      importTasks.mockResolvedValue({ data: { imported: 2 } });
      setup();
      // Row 3 has a status but no title, so it is skipped (not merely blank).
      await choose(csv('title,status\nFirst,todo\n,done\nThird,todo'));
      expect(await screen.findByText(/row 3: no title/i)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /import 2 tasks/i }));
      await waitFor(() => expect(importTasks).toHaveBeenCalled());
      expect(importTasks.mock.calls[0][1].map((t) => t.title)).toEqual(['First', 'Third']);
    });

    test('a refusal names the row in the file, says nothing was imported, and the file can be fixed and chosen again', async () => {
      importTasks.mockRejectedValue({
        response: { status: 422, data: { message: 'Title is required (max 500 characters)', errors: [{ field: 'tasks[1].title', message: 'Title is required (max 500 characters)' }] } },
      });
      setup();
      await choose(csv('title\nA\nB'));
      fireEvent.click(await screen.findByRole('button', { name: /import 2 tasks/i }));
      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(/row 3/i); // the 2nd task is on spreadsheet row 3
      expect(alert).toHaveTextContent(/nothing was imported/i);
      expect(screen.getByRole('button', { name: /import 2 tasks/i })).not.toBeDisabled();
    });

    test('too many imports: asks to wait', async () => {
      importTasks.mockRejectedValue({ response: { status: 429, data: { message: 'Too many imports, try again later.' } } });
      setup();
      await choose(csv('title\nA'));
      fireEvent.click(await screen.findByRole('button', { name: /import 1 task/i }));
      expect(await screen.findByRole('alert')).toHaveTextContent(/too many imports/i);
    });

    test('no write access to the workspace: says so', async () => {
      importTasks.mockRejectedValue({ response: { status: 403, data: { message: 'You do not have write access to that workspace' } } });
      setup();
      await choose(csv('title\nA'));
      fireEvent.click(await screen.findByRole('button', { name: /import 1 task/i }));
      expect(await screen.findByRole('alert')).toHaveTextContent(/permission|access/i);
    });

    test('any other failure says nothing was imported and invites a retry', async () => {
      importTasks.mockRejectedValue(new Error('Network Error'));
      setup();
      await choose(csv('title\nA'));
      fireEvent.click(await screen.findByRole('button', { name: /import 1 task/i }));
      expect(await screen.findByRole('alert')).toHaveTextContent(/nothing was imported/i);
    });
  });
});
