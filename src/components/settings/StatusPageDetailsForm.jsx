import React, { useId, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { updateStatusPage } from '../../services/workspaceService';
import { ACCENT_KEYS, STATUS_ACCENTS } from '../../config/statusAccents';

const LIMITS = { headline: 120, summary: 600, milestoneTitle: 100 };
const inputClass =
  'w-full rounded-lg border border-light-border bg-light-surface px-3 py-2 text-sm text-light-text dark:border-dark-border dark:bg-dark-raised dark:text-dark-text';
const labelClass = 'mb-1 flex items-baseline justify-between text-sm font-medium text-light-text dark:text-dark-text';
const counterClass = 'text-xs font-normal text-light-muted dark:text-dark-muted';

// What the public status page says about the project, set by the workspace
// owner: a headline, a short summary, the next milestone, an accent colour and,
// on Pro, hiding the "Powered by Motive" footer. Rendered inside
// StatusPageCard once sharing is on. All of it is public plain text.
const StatusPageDetailsForm = () => {
  const { user } = useAuth();
  const { workspace, loadWorkspace } = useWorkspace();
  const ids = { headline: useId(), summary: useId(), milestoneTitle: useId(), milestoneDate: useId(), hide: useId(), feedback: useId() };

  const [form, setForm] = useState(() => ({
    headline: workspace.statusHeadline || '',
    summary: workspace.statusSummary || '',
    milestoneTitle: workspace.milestoneTitle || '',
    milestoneDate: workspace.milestoneDate ? workspace.milestoneDate.slice(0, 10) : '',
    accent: workspace.statusAccent || 'teal',
    hideBranding: !!workspace.statusHideBranding,
    allowFeedback: !!workspace.statusAllowFeedback,
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const set = (key) => (e) => {
    setSaved(false);
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      await updateStatusPage(workspace.id, {
        headline: form.headline,
        summary: form.summary,
        milestoneTitle: form.milestoneTitle,
        milestoneDate: form.milestoneDate || null,
        accent: form.accent,
        hideBranding: form.hideBranding,
        allowFeedback: form.allowFeedback,
      });
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={ids.milestoneTitle} className={labelClass}>
            Next milestone name
            <span className={counterClass}>{form.milestoneTitle.length} / {LIMITS.milestoneTitle}</span>
          </label>
          <input id={ids.milestoneTitle} className={inputClass} maxLength={LIMITS.milestoneTitle} value={form.milestoneTitle} onChange={set('milestoneTitle')} placeholder="Design sign-off" />
        </div>
        <div>
          <label htmlFor={ids.milestoneDate} className={labelClass}>Next milestone date</label>
          <input id={ids.milestoneDate} type="date" className={inputClass} value={form.milestoneDate} onChange={set('milestoneDate')} />
        </div>
      </div>

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
          Hide “Powered by Motive”
        </label>
        {!canHide && (
          <p className="mt-1 text-xs text-light-muted dark:text-dark-muted">Hiding it is part of Motive Pro.</p>
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
