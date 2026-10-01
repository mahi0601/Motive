import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, Sparkles, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { SAMPLE_PAGE_TITLE, SAMPLE_TASKS, dateInDays, dismiss, getSteps, isDismissed } from '../../utils/gettingStarted';
import { logger } from '../../utils/logger';

// A short checklist for a new account, shown on My Work until everything is done
// or the user hides it. It leads to the client status link, which is what the
// product is for, and offers a sample client project so there is something to
// show on that link straight away.
const GettingStartedCard = ({ tasks, createTask, onAddTask }) => {
  const { user } = useAuth();
  const { workspace, pages, addPage, loadWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(() => isDismissed(user?.id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const steps = getSteps({ tasks, pages, workspace, user });
  const doneCount = steps.filter((s) => s.done).length;
  if (hidden || doneCount === steps.length) return null;

  const hide = () => {
    dismiss(user?.id);
    setHidden(true);
  };

  const startPage = async () => {
    try {
      const page = await addPage({ title: 'Project brief' });
      navigate(`/page/${page.id}`);
    } catch (err) {
      logger.warn('Could not create a page from the checklist', { status: err?.response?.status });
      setError('Could not create the page. Try again.');
    }
  };

  const actions = {
    'first-task': onAddTask,
    'share-status': () => navigate('/settings'),
    'first-page': startPage,
    'confirm-email': () => navigate('/settings'),
    invite: () => navigate('/settings'),
  };

  const addSample = async () => {
    setBusy(true);
    setError('');
    try {
      for (const { dueInDays, ...task } of SAMPLE_TASKS) {
        await createTask({ ...task, ...(dueInDays != null ? { dueDate: dateInDays(dueInDays) } : {}) });
      }
      await addPage({ title: SAMPLE_PAGE_TITLE });
      await loadWorkspace?.();
    } catch (err) {
      logger.warn('Could not add the sample project', { status: err?.response?.status });
      setError('Could not add the sample project. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      aria-labelledby="getting-started-title"
      className="mb-6 rounded-xl border border-light-border bg-light-surface p-5 shadow-sm dark:border-dark-border dark:bg-dark-raised"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 id="getting-started-title" className="flex items-center gap-2 font-semibold text-light-text dark:text-dark-text">
            <Sparkles size={18} className="text-brand-500" /> Getting started
          </h3>
          <p className="mt-1 text-sm text-light-muted dark:text-dark-muted">{doneCount} of {steps.length} done</p>
        </div>
        <button
          type="button"
          onClick={hide}
          aria-label="Hide getting started"
          className="rounded p-1 text-light-muted hover:bg-light-border/40 dark:text-dark-muted dark:hover:bg-white/5"
        >
          <X size={16} />
        </button>
      </div>

      <div
        role="progressbar"
        aria-label="Getting started progress"
        aria-valuemin={0}
        aria-valuemax={steps.length}
        aria-valuenow={doneCount}
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-light-border dark:bg-dark-border"
      >
        <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
      </div>

      <ul className="mt-4 space-y-1">
        {steps.map((step) => (
          <li key={step.id}>
            {step.done ? (
              <span className="flex items-center gap-2 py-1.5 text-sm text-light-muted line-through dark:text-dark-muted">
                <CheckCircle2 size={16} className="shrink-0 text-brand-500" aria-hidden="true" />
                <span className="sr-only">Done: </span>
                {step.label}
              </span>
            ) : (
              <button
                type="button"
                onClick={actions[step.id]}
                className="flex w-full items-center gap-2 rounded-lg py-1.5 text-left text-sm text-light-text hover:bg-light-border/40 dark:text-dark-text dark:hover:bg-white/5"
              >
                <Circle size={16} className="shrink-0 text-light-muted dark:text-dark-muted" aria-hidden="true" />
                {step.label}
              </button>
            )}
          </li>
        ))}
      </ul>

      {tasks.length === 0 && (
        <button
          type="button"
          onClick={addSample}
          disabled={busy}
          className="mt-4 rounded-lg border border-light-border px-3 py-1.5 text-sm font-medium text-light-text disabled:opacity-60 dark:border-dark-border dark:text-dark-text"
        >
          {busy ? 'Adding…' : 'Add a sample client project'}
        </button>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-semantic-danger-500 dark:text-semantic-danger-dark">
          {error}
        </p>
      )}
    </section>
  );
};

export default GettingStartedCard;
