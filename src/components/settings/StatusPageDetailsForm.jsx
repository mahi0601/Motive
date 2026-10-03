import React, { useId, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { saveMilestones, updateStatusPage } from '../../services/workspaceService';
import { ACCENT_KEYS, STATUS_ACCENTS } from '../../config/statusAccents';
import {
  MAX_MILESTONES,
  MILESTONE_TITLE_MAX,
  keptRows,
  milestoneRowsFrom,
  newMilestoneRow,
  sameRows,
  toPayload,
  validateRows,
} from '../../utils/milestones';

const LIMITS = { headline: 120, summary: 600 };
const inputClass =
  'w-full rounded-lg border border-light-border bg-light-surface px-3 py-2 text-sm text-light-text dark:border-dark-border dark:bg-dark-raised dark:text-dark-text';
const labelClass = 'mb-1 flex items-baseline justify-between text-sm font-medium text-light-text dark:text-dark-text';
const counterClass = 'text-xs font-normal text-light-muted dark:text-dark-muted';

// What the public status page says about the project, set by the workspace
// owner: a headline, a short summary, its milestones, an accent colour and,
// on Pro, hiding the "Powered by Clientglass" footer. Rendered inside
// StatusPageCard once sharing is on. All of it is public plain text.
const StatusPageDetailsForm = () => {
  const { user } = useAuth();
  const { workspace, loadWorkspace } = useWorkspace();
  const ids = { headline: useId(), summary: useId(), rows: useId(), hide: useId(), feedback: useId() };

  const [form, setForm] = useState(() => ({
    headline: workspace.statusHeadline || '',
    summary: workspace.statusSummary || '',
    accent: workspace.statusAccent || 'teal',
    hideBranding: !!workspace.statusHideBranding,
    allowFeedback: !!workspace.statusAllowFeedback,
  }));
  // The milestones are edited as rows, in order. `savedRows` is what the server has
  // (ids included), so unchanged milestones are not sent again. After a save the rows
  // take the ids the server returns: without them a second save would send the rows
  // as new, deleting and recreating them and losing every sign-off.
  const [rows, setRows] = useState(() => milestoneRowsFrom(workspace));
  const savedRows = useRef(rows);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const changeRows = (next) => {
    setSaved(false);
    setRows(next.length ? next : [newMilestoneRow()]);
  };
  const editRow = (key, field) => (e) => changeRows(rows.map((r) => (r.key === key ? { ...r, [field]: e.target.value } : r)));
  const move = (i, by) => {
    const next = [...rows];
    [next[i], next[i + by]] = [next[i + by], next[i]];
    changeRows(next);
  };

  const set = (key) => (e) => {
    setSaved(false);
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const problem = validateRows(rows);
    if (problem) {
      setSaved(false);
      setError(problem);
      return;
    }
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      // The page details first, the milestones last: the milestone save is all or
      // nothing, so if it fails nothing about the milestones has changed and saving
      // again is safe.
      await updateStatusPage(workspace.id, {
        headline: form.headline,
        summary: form.summary,
        accent: form.accent,
        hideBranding: form.hideBranding,
        allowFeedback: form.allowFeedback,
      });
      if (!sameRows(rows, savedRows.current)) {
        const { data } = await saveMilestones(workspace.id, toPayload(rows));
        const next = keptRows(rows).map((r, i) => ({ ...r, title: r.title.trim(), id: data?.milestones?.[i]?.id ?? r.id }));
        const display = next.length ? next : [newMilestoneRow()];
        savedRows.current = display;
        setRows(display);
      }
      await loadWorkspace();
      setSaved(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not save. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const canHide = !!user?.isPro;

  return (
    <form onSubmit={handleSave} className="mt-5 space-y-4 border-t border-light-border pt-5 dark:border-dark-border">
      <div>
        <h5 className="font-semibold text-light-text dark:text-dark-text">What your client sees</h5>
        <p className="mt-1 text-sm text-light-muted dark:text-dark-muted">
          Everything in this section is shown publicly to anyone with the link. Keep it free of confidential details.
        </p>
      </div>

      <div>
        <label htmlFor={ids.headline} className={labelClass}>
          Headline
          <span className={counterClass}>{form.headline.length} / {LIMITS.headline}</span>
        </label>
        <input id={ids.headline} className={inputClass} maxLength={LIMITS.headline} value={form.headline} onChange={set('headline')} placeholder="Website redesign for Acme" />
      </div>

      <div>
        <label htmlFor={ids.summary} className={labelClass}>
          Summary
          <span className={counterClass}>{form.summary.length} / {LIMITS.summary}</span>
        </label>
        <textarea id={ids.summary} rows={3} className={inputClass} maxLength={LIMITS.summary} value={form.summary} onChange={set('summary')} placeholder="Where the project stands, in a sentence or two." />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-light-text dark:text-dark-text">Milestones</legend>
        <p className="text-xs text-light-muted dark:text-dark-muted">
          A page can show up to {MAX_MILESTONES} milestones, in the order you list them; the first is the next one. A client
          approves each milestone separately. Changing a milestone’s name or date clears its approval.
        </p>
        {rows.map((row, i) => {
          const n = i + 1;
          const label = i === 0 ? 'Next milestone' : `Milestone ${n}`;
          const titleId = `${ids.rows}-${row.key}-title`;
          const dateId = `${ids.rows}-${row.key}-date`;
          const iconButton =
            'rounded-lg border border-light-border p-2 text-light-text transition hover:bg-light-border/40 disabled:cursor-not-allowed disabled:opacity-40 dark:border-dark-border dark:text-dark-text dark:hover:bg-dark-raised';
          return (
            <div key={row.key} className="grid items-end gap-3 sm:grid-cols-[1fr_11rem_auto]">
              <div>
                <label htmlFor={titleId} className={labelClass}>{label} name</label>
                <input id={titleId} className={inputClass} maxLength={MILESTONE_TITLE_MAX} value={row.title} onChange={editRow(row.key, 'title')} placeholder={i === 0 ? 'Design sign-off' : ''} />
              </div>
              <div>
                <label htmlFor={dateId} className={labelClass}>{label} date</label>
                <input id={dateId} type="date" className={inputClass} value={row.date} onChange={editRow(row.key, 'date')} />
              </div>
              <div className="flex gap-1">
                <button type="button" className={iconButton} aria-label={`Move milestone ${n} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                  <ArrowUp size={16} aria-hidden="true" />
                </button>
                <button type="button" className={iconButton} aria-label={`Move milestone ${n} down`} disabled={i === rows.length - 1} onClick={() => move(i, 1)}>
                  <ArrowDown size={16} aria-hidden="true" />
                </button>
                <button type="button" className={iconButton} aria-label={`Remove milestone ${n}`} onClick={() => changeRows(rows.filter((r) => r.key !== row.key))}>
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
        <button
          type="button"
          disabled={rows.length >= MAX_MILESTONES}
          onClick={() => changeRows([...rows, newMilestoneRow()])}
          className="inline-flex items-center gap-1.5 rounded-lg border border-brand-600 px-3 py-1.5 text-sm font-medium text-brand-600 transition hover:bg-brand-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-white dark:text-white"
        >
          <Plus size={16} aria-hidden="true" />
          Add milestone
        </button>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-light-text dark:text-dark-text">Accent colour</legend>
        <div className="flex flex-wrap gap-2">
          {ACCENT_KEYS.map((key) => (
            <label
              key={key}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm text-light-text dark:text-dark-text ${
                form.accent === key ? 'border-brand-500 ring-1 ring-brand-500' : 'border-light-border dark:border-dark-border'
              }`}
            >
              <input
                type="radio"
                name="status-accent"
                value={key}
                checked={form.accent === key}
                onChange={set('accent')}
                className="sr-only"
              />
              <span aria-hidden="true" className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: STATUS_ACCENTS[key].light }} />
              {STATUS_ACCENTS[key].label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor={ids.hide} className={`flex items-center gap-2 text-sm ${canHide ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'} text-light-text dark:text-dark-text`}>
          <input
            id={ids.hide}
            type="checkbox"
            disabled={!canHide}
            checked={form.hideBranding && canHide}
            onChange={(e) => {
              setSaved(false);
              setForm((f) => ({ ...f, hideBranding: e.target.checked }));
            }}
          />
          Hide “Powered by Clientglass”
        </label>
        {!canHide && (
          <p className="mt-1 text-xs text-light-muted dark:text-dark-muted">Hiding it is part of Clientglass Pro.</p>
        )}
      </div>

      <div>
        <label htmlFor={ids.feedback} className="flex cursor-pointer items-center gap-2 text-sm text-light-text dark:text-dark-text">
          <input
            id={ids.feedback}
            type="checkbox"
            checked={form.allowFeedback}
            onChange={(e) => {
              setSaved(false);
              setForm((f) => ({ ...f, allowFeedback: e.target.checked }));
            }}
          />
          Let clients respond from the page (approve, request changes, comment)
        </label>
        <p className="mt-1 text-xs text-light-muted dark:text-dark-muted">
          Anyone with the link can send you a message under any name. Messages are shown only to you, never published.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-semantic-danger-700 dark:text-semantic-danger-dark">{error}</p>
      )}
      {saved && (
        <p role="status" className="text-sm text-light-muted dark:text-dark-muted">Saved. Your client’s page updates within a minute.</p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
      >
        {busy ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
};

export default StatusPageDetailsForm;
