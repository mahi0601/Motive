import React, { useEffect, useId, useMemo, useState } from 'react';
import { Copy, Mail, MessageCircle, Share2 } from 'lucide-react';
import { getUpdateSummary } from '../../services/workspaceService';
import { buildUpdateMessage, mailtoUrl, whatsappUrl } from '../../utils/shareMessage';

const buttonClass =
  'inline-flex items-center gap-1.5 rounded-lg border border-brand-600 px-3 py-2 text-sm font-medium text-brand-600 transition hover:bg-brand-600 hover:text-white dark:border-white dark:text-white';

// A ready-written progress note for one client, built from the same facts as the weekly email
// (done, in progress, coming up, next milestone) and sent by hand: WhatsApp, email, the device's
// share sheet or copy. The owner can edit every word first. Nothing typed here is stored or sent
// by us. The link is added only when the owner has it (it is shown once, when created).
const ProgressUpdatePanel = ({ workspaceId, workspaceName, link, onClose }) => {
  const nameId = useId();
  const textId = useId();
  const [state, setState] = useState({ status: 'loading' }); // loading | ready | empty | error
  const [clientName, setClientName] = useState('');
  const [custom, setCustom] = useState(null);
  const [copied, setCopied] = useState(false);
  const [problem, setProblem] = useState('');

  useEffect(() => {
    let live = true;
    getUpdateSummary(workspaceId)
      .then(({ data }) => live && setState({ status: 'ready', summary: data.summary }))
      .catch((err) => {
        if (!live) return;
        if (err?.response?.status === 422) setState({ status: 'empty', message: err.response.data?.message });
        else setState({ status: 'error' });
      });
    return () => {
      live = false;
    };
  }, [workspaceId]);

  const message = useMemo(
    () => (state.status === 'ready' ? buildUpdateMessage({ clientName, workspaceName, summary: state.summary, link }) : null),
    [state, clientName, workspaceName, link],
  );
  const body = custom ?? message?.body ?? '';
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copy = async () => {
    setCopied(false);
    setProblem('');
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
    } catch {
      setProblem('Could not copy automatically. Select the text and copy it by hand.');
    }
  };

  const share = async () => {
    setProblem('');
    try {
      await navigator.share({ title: message.subject, text: body });
    } catch (err) {
      if (err?.name !== 'AbortError') setProblem('Sharing did not work here. Use Email, WhatsApp or Copy instead.');
    }
  };

  return (
    <section aria-label="Progress update" className="mt-4 rounded-lg border border-brand-200 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-900/20">
      <div className="flex items-start justify-between gap-2">
        <h5 className="font-semibold text-light-text dark:text-dark-text">Send a progress update</h5>
        <button type="button" onClick={onClose} className="text-sm text-light-muted underline dark:text-dark-muted">Close</button>
      </div>

      {state.status === 'loading' && <p role="status" className="mt-2 text-sm text-light-muted dark:text-dark-muted">Writing your update…</p>}
      {state.status === 'empty' && (
        <p className="mt-2 text-sm text-light-muted dark:text-dark-muted">
          {state.message || 'Nothing finished or in progress yet, so there is nothing to share.'} Move a task to In progress or Done and try again.
        </p>
      )}
      {state.status === 'error' && <p role="alert" className="mt-2 text-sm text-semantic-danger-700 dark:text-semantic-danger-dark">Could not build the update. Please try again.</p>}

      {state.status === 'ready' && (
        <>
          <p className="mt-1 text-sm text-light-muted dark:text-dark-muted">
            Written from this client’s board. Change anything you like, then send it from your own WhatsApp or email.
          </p>
          <div className="mt-3">
            <label htmlFor={nameId} className="mb-1 block text-sm font-medium text-light-text dark:text-dark-text">{"Client's first name (optional)"}</label>
            <input
              id={nameId}
              value={clientName}
              maxLength={60}
              onChange={(e) => {
                setClientName(e.target.value);
                setCustom(null);
              }}
              className="w-full rounded-lg border border-light-border bg-light-surface px-3 py-2 text-sm text-light-text dark:border-dark-border dark:bg-dark-raised dark:text-dark-text"
            />
          </div>
          <div className="mt-3">
            <label htmlFor={textId} className="mb-1 block text-sm font-medium text-light-text dark:text-dark-text">Update for your client</label>
            <textarea
              id={textId}
              rows={10}
              value={body}
              onChange={(e) => {
                setCustom(e.target.value);
                setCopied(false);
              }}
              className="w-full rounded-lg border border-light-border bg-light-surface px-3 py-2 text-sm text-light-text dark:border-dark-border dark:bg-dark-raised dark:text-dark-text"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={whatsappUrl({ body })} target="_blank" rel="noopener noreferrer" className={buttonClass}>
              <MessageCircle size={16} aria-hidden="true" /> WhatsApp
            </a>
            <a href={mailtoUrl({ subject: message.subject, body })} className={buttonClass}>
              <Mail size={16} aria-hidden="true" /> Email it
            </a>
            {canShare && (
              <button type="button" onClick={share} className={buttonClass}>
                <Share2 size={16} aria-hidden="true" /> Share…
              </button>
            )}
            <button type="button" onClick={copy} className={buttonClass}>
              <Copy size={16} aria-hidden="true" /> Copy update
            </button>
          </div>
          {problem && <p role="alert" className="mt-2 text-sm text-semantic-danger-700 dark:text-semantic-danger-dark">{problem}</p>}
          {copied && <p role="status" className="mt-2 text-sm text-light-muted dark:text-dark-muted">Copied. Paste it into your message.</p>}
        </>
      )}
    </section>
  );
};

export default ProgressUpdatePanel;
