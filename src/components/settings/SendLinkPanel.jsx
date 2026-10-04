import React, { useId, useMemo, useState } from 'react';
import { Copy, Mail, MessageCircle, Send, Share2 } from 'lucide-react';
import { buildShareMessage, mailtoUrl, whatsappUrl } from '../../utils/shareMessage';

const buttonClass =
  'inline-flex items-center gap-1.5 rounded-lg border border-brand-600 px-3 py-2 text-sm font-medium text-brand-600 transition hover:bg-brand-600 hover:text-white dark:border-white dark:text-white';

// Shown right after a status link is created, the one moment the link can be seen: a ready-written,
// editable message and one-click ways to send it (email, WhatsApp, the device's share sheet) or
// copy it. Getting the link to the client is the step that decides whether anything else in the
// product happens, and it should not depend on the owner remembering to copy it. Works with no
// email set-up: it opens the owner's own mail or WhatsApp. Nothing typed here is stored.
const SendLinkPanel = ({ link, workspaceName, canRespond }) => {
  const nameId = useId();
  const textId = useId();
  const [clientName, setClientName] = useState('');
  const [custom, setCustom] = useState(null); // the owner's own wording, once they edit it
  const [copied, setCopied] = useState(false);
  const [problem, setProblem] = useState('');

  const message = useMemo(() => buildShareMessage({ clientName, workspaceName, link, canRespond }), [clientName, workspaceName, link, canRespond]);
  const body = custom ?? message.body;
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
      // Closing the share sheet is not an error.
      if (err?.name !== 'AbortError') setProblem('Sharing did not work here. Use Email, WhatsApp or Copy instead.');
    }
  };

  return (
    <section aria-label="Send it to your client" className="mt-4 rounded-lg border border-brand-200 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-900/20">
      <h5 className="flex items-center gap-2 font-semibold text-light-text dark:text-dark-text">
        <Send size={16} aria-hidden="true" className="text-brand-500" /> Send it to your client
      </h5>
      <p className="mt-1 text-sm text-light-muted dark:text-dark-muted">
        This link will not be shown again, so send it now. We have written a message for you; change anything you like.
      </p>

      <div className="mt-3">
        <label htmlFor={nameId} className="mb-1 block text-sm font-medium text-light-text dark:text-dark-text">{"Client's first name (optional)"}</label>
        <input
          id={nameId}
          value={clientName}
          maxLength={60}
          onChange={(e) => setClientName(e.target.value)}
          className="w-full rounded-lg border border-light-border bg-light-surface px-3 py-2 text-sm text-light-text dark:border-dark-border dark:bg-dark-raised dark:text-dark-text"
        />
      </div>

      <div className="mt-3">
        <label htmlFor={textId} className="mb-1 block text-sm font-medium text-light-text dark:text-dark-text">Message to your client</label>
        <textarea
          id={textId}
          rows={7}
          value={body}
          onChange={(e) => {
            setCustom(e.target.value);
            setCopied(false);
          }}
          className="w-full rounded-lg border border-light-border bg-light-surface px-3 py-2 text-sm text-light-text dark:border-dark-border dark:bg-dark-raised dark:text-dark-text"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <a href={mailtoUrl({ subject: message.subject, body })} className={buttonClass}>
          <Mail size={16} aria-hidden="true" /> Email it
        </a>
        <a href={whatsappUrl({ body })} target="_blank" rel="noopener noreferrer" className={buttonClass}>
          <MessageCircle size={16} aria-hidden="true" /> WhatsApp
        </a>
        {canShare && (
          <button type="button" onClick={share} className={buttonClass}>
            <Share2 size={16} aria-hidden="true" /> Share…
          </button>
        )}
        <button type="button" onClick={copy} className={buttonClass}>
          <Copy size={16} aria-hidden="true" /> Copy message
        </button>
      </div>

      {problem && (
        <p role="alert" className="mt-2 text-sm text-semantic-danger-700 dark:text-semantic-danger-dark">{problem}</p>
      )}
      {copied && (
        <p role="status" className="mt-2 text-sm text-light-muted dark:text-dark-muted">Copied. Paste it into your message.</p>
      )}
    </section>
  );
};

export default SendLinkPanel;
