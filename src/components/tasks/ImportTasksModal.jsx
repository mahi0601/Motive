import React, { useEffect, useId, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X } from 'lucide-react';
import { importTasks } from '../../services/taskService';
import { parseCsv } from '../../utils/csv';
import { SAMPLE_CSV, buildImport } from '../../utils/taskImport';

const MAX_BYTES = 1024 * 1024;
const PREVIEW_ROWS = 5;
const STATUS_LABEL = { todo: 'To do', in_progress: 'In progress', done: 'Done' };
const FIELD_LABEL = {
  title: 'the title',
  description: 'the description',
  status: 'the status',
  priority: 'the priority',
  dueDate: 'the due date',
  completedAt: 'the completed date',
  category: 'the category',
  tags: 'the tags',
};

const readText = (file) =>
  typeof file.text === 'function'
    ? file.text()
    : new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsText(file);
      });

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// A refused import is all or nothing, so say that, and say which ROW OF THE FILE is at
// fault: the server counts the tasks that were sent, which are the file's rows minus
// the skipped ones, so the position is mapped back.
const explain = (err, built) => {
  const status = err?.response?.status;
  const data = err?.response?.data;
  if (status === 429) return 'Too many imports in a short time. Please wait a few minutes and try again.';
  if (status === 403) return 'You do not have permission to add tasks to this workspace.';
  if (status === 422) {
    const first = data?.errors?.[0];
    const m = /^tasks\[(\d+)\]/.exec(first?.field || '');
    const item = m ? built.items.filter((i) => i.task)[Number(m[1])] : null;
    return `${item ? `Row ${item.line}: ` : ''}${first?.message || data?.message || 'The file was refused.'} Nothing was imported.`;
  }
  return 'Could not import the file. Nothing was imported. Please try again.';
};

// Import tasks from a CSV (Trello, Notion, a spreadsheet). The file is read in the
// browser and shown back before anything is sent: how many tasks, which column became
// what, what was skipped and why, and anything that had to be guessed.
const ImportTasksModal = ({ workspace, onClose, onImported }) => {
  const titleId = useId();
  const fileId = useId();
  const panelRef = useRef(null);
  const busyRef = useRef(false);
  const [built, setBuilt] = useState(null);
  const [fileError, setFileError] = useState('');
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  // Dialog behaviour: Escape closes it (not while an import is running), focus moves in
  // when it opens and back where it was when it closes.
  useEffect(() => {
    const previous = document.activeElement;
    panelRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape' && !busyRef.current) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFile = async (e) => {
    const input = e.target;
    const file = input.files?.[0];
    setBuilt(null);
    setFileError('');
    setServerError('');
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setFileError('That file is larger than 1 MB. Split it into smaller files and import them one at a time.');
      return;
    }
    try {
      const text = await readText(file);
      if (text.includes('\u0000')) {
        setFileError('That file does not look like a CSV (it is not plain text). Export it as CSV and try again.');
      } else {
        const result = buildImport(parseCsv(text));
        if (result.ok) setBuilt(result);
        else setFileError(result.error);
      }
    } catch (err) {
      setFileError(/quote/i.test(err?.message || '') ? err.message : 'Could not read that file.');
    }
    try {
      input.value = ''; // so choosing the same file again, after fixing it, is noticed
    } catch {
      // some environments do not allow resetting a file input
    }
  };

  const downloadSample = () => {
    const url = URL.createObjectURL(new Blob([SAMPLE_CSV], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clientglass-tasks-sample.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (busyRef.current || !built) return;
    busyRef.current = true;
    setBusy(true);
    setServerError('');
    try {
      const { data } = await importTasks(workspace.id, built.tasks);
      const count = data?.imported ?? built.tasks.length;
      setDone(count);
      onImported?.(count);
    } catch (err) {
      setServerError(explain(err, built));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const hasDone = built?.tasks.some((t) => t.status === 'done');
  const count = built?.tasks.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={() => !busyRef.current && onClose()}
    >
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-light-border bg-light-surface shadow-2xl outline-none dark:border-dark-border dark:bg-dark-raised"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-light-border p-4 dark:border-dark-border">
          <h2 id={titleId} className="flex items-center gap-2 text-sm font-semibold text-brand-600 dark:text-brand-400">
            <Upload size={16} aria-hidden="true" /> Import tasks
          </h2>
          <button type="button" onClick={onClose} disabled={busy} className="rounded p-1 hover:bg-black/10 disabled:opacity-50" aria-label="Close">
            <X size={16} aria-hidden="true" className="text-light-muted dark:text-dark-muted" />
          </button>
        </div>

        <div className="space-y-4 p-5 text-sm text-light-text dark:text-dark-text">
          {done !== null ? (
            <div className="space-y-3">
              <p role="status">Imported {plural(done, 'task')} into “{workspace.name}”.</p>
              <button type="button" onClick={onClose} className="rounded-lg bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700">
                Done
              </button>
            </div>
          ) : (
            <>
              <p className="text-light-muted dark:text-dark-muted">
                Tasks are added to “{workspace.name}”. Choose a CSV from Trello, Notion, Asana or a spreadsheet. We look for columns named
                Title, Name, Task or Card Name, plus Description, Status or List, Priority, Due date, Category and Tags or Labels. Up to 500
                rows at a time.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <label htmlFor={fileId} className="cursor-pointer rounded-lg border border-brand-600 px-4 py-2 font-medium text-brand-600 transition hover:bg-brand-600 hover:text-white dark:border-white dark:text-white">
                  Choose a CSV file
                </label>
                <input id={fileId} type="file" accept=".csv,text/csv,text/plain" onChange={handleFile} className="sr-only" />
                <button type="button" onClick={downloadSample} className="text-brand-600 hover:underline dark:text-brand-400">
                  Download a sample file
                </button>
              </div>

              {fileError && (
                <p role="alert" className="rounded-lg border border-semantic-danger-200 bg-semantic-danger-50 px-3 py-2 text-semantic-danger-700 dark:border-semantic-danger-500/30 dark:bg-semantic-danger-500/10 dark:text-semantic-danger-dark">
                  {fileError}
                </p>
              )}

              {built && (
                <div className="space-y-3">
                  <p role="status" className="font-medium">
                    {plural(count, 'task')} ready to import into “{workspace.name}”.
                  </p>
                  <p className="text-light-muted dark:text-dark-muted">
                    Using {built.mapping.map((m) => `“${m.header}” as ${FIELD_LABEL[m.field]}`).join(', ')}.
                    {built.ignoredHeaders.length > 0 && ` Not used: ${built.ignoredHeaders.join(', ')}.`}
                  </p>

                  {built.skipped.length > 0 && (
                    <div>
                      <p className="font-medium">{plural(built.skipped.length, 'row')} skipped</p>
                      <ul className="mt-1 list-disc pl-5 text-light-muted dark:text-dark-muted">
                        {built.skipped.slice(0, 5).map((s) => (
                          <li key={s.line}>Row {s.line}: {s.reason}</li>
                        ))}
                        {built.skipped.length > 5 && <li>and {built.skipped.length - 5} more</li>}
                      </ul>
                    </div>
                  )}

                  {built.warnings.length > 0 && (
                    <ul className="list-disc space-y-1 pl-5 text-semantic-warning-700 dark:text-semantic-warning-dark">
                      {built.warnings.map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  )}

                  {hasDone && (
                    <p className="text-light-muted dark:text-dark-muted">
                      Tasks marked done are dated from the file’s completed date, or else their due date, so a backlog will not be counted as
                      shipped today.
                    </p>
                  )}

                  {count > 0 && (
                    <div className="overflow-x-auto">
                      <table aria-label="Preview of the first rows" className="w-full text-left">
                        <thead>
                          <tr className="border-b border-light-border text-xs uppercase tracking-wide text-light-muted dark:border-dark-border dark:text-dark-muted">
                            <th scope="col" className="py-1 pr-3 font-medium">Title</th>
                            <th scope="col" className="py-1 pr-3 font-medium">Status</th>
                            <th scope="col" className="py-1 pr-3 font-medium">Priority</th>
                            <th scope="col" className="py-1 font-medium">Due</th>
                          </tr>
                        </thead>
                        <tbody>
                          {built.tasks.slice(0, PREVIEW_ROWS).map((t, i) => (
                            <tr key={i} className="border-b border-light-border/60 dark:border-dark-border/60">
                              <td className="max-w-[12rem] truncate py-1 pr-3">{t.title}</td>
                              <td className="py-1 pr-3">{STATUS_LABEL[t.status]}</td>
                              <td className="py-1 pr-3">{t.priority}</td>
                              <td className="py-1">{t.dueDate || ''}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {count > PREVIEW_ROWS && <p className="mt-1 text-light-muted dark:text-dark-muted">and {count - PREVIEW_ROWS} more</p>}
                    </div>
                  )}
                </div>
              )}

              {serverError && (
                <p role="alert" className="rounded-lg border border-semantic-danger-200 bg-semantic-danger-50 px-3 py-2 text-semantic-danger-700 dark:border-semantic-danger-500/30 dark:bg-semantic-danger-500/10 dark:text-semantic-danger-dark">
                  {serverError}
                </p>
              )}

              {built && count > 0 && (
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={busy}
                  className="rounded-lg bg-brand-gradient px-4 py-2 font-medium text-white shadow-brand-sm transition hover:shadow-brand disabled:opacity-60"
                >
                  {busy ? 'Importing…' : `Import ${plural(count, 'task')}`}
                </button>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ImportTasksModal;
