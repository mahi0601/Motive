import React, { useState } from 'react';
import { Download, MailCheck, MailWarning } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { resendVerification } from '../../services/authService';
import { downloadMyData } from '../../services/userService';
import { logger } from '../../utils/logger';
import { CARD_CLASS } from './cardStyles';

// Two account-level things that are not billing or deletion: whether the email
// address has been confirmed (inviting teammates needs it), and a download of
// the account's own data.
const AccountCard = () => {
  const { user } = useAuth();
  const verified = !!user?.emailVerifiedAt;

  const [resend, setResend] = useState({ state: 'idle', message: '' });
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  const handleResend = async () => {
    setResend({ state: 'sending', message: '' });
    try {
      await resendVerification();
      setResend({ state: 'sent', message: 'Sent — check your inbox (and spam).' });
    } catch (err) {
      setResend({
        state: 'error',
        message: err?.response?.status === 429 ? 'Too many emails — try again in an hour.' : 'Could not send the email. Try again.',
      });
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setExportError('');
    try {
      await downloadMyData();
    } catch (err) {
      logger.warn('Data export failed', { status: err?.response?.status });
      setExportError(
        err?.response?.status === 429 ? 'You can download your data once an hour. Try again later.' : 'Could not prepare your download. Try again.'
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={CARD_CLASS}>
      <h3 className="font-semibold text-light-text dark:text-dark-text mb-1">Account</h3>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {verified ? (
          <p className="flex items-center gap-2 text-sm text-light-muted dark:text-dark-muted">
            <MailCheck size={16} className="text-brand-500" /> {user.email} is confirmed.
          </p>
        ) : (
          <>
            <p className="flex items-center gap-2 text-sm text-light-text dark:text-dark-text">
              <MailWarning size={16} className="text-semantic-danger-700" /> Confirm {user?.email} to invite teammates.
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resend.state === 'sending'}
              className="rounded-lg border border-light-border dark:border-dark-border px-3 py-1.5 text-sm font-medium disabled:opacity-60"
            >
              {resend.state === 'sending' ? 'Sending…' : 'Resend confirmation email'}
            </button>
          </>
        )}
      </div>
      {resend.message && (
        <p role="status" className="mt-2 text-sm text-light-muted dark:text-dark-muted">
          {resend.message}
        </p>
      )}

      <div className="mt-5 border-t border-light-border dark:border-dark-border pt-4">
        <p className="text-sm text-light-muted dark:text-dark-muted mb-3">
          Download a copy of your tasks, pages, comments and settings as a JSON file.
        </p>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 rounded-lg border border-light-border dark:border-dark-border px-3 py-1.5 text-sm font-medium disabled:opacity-60"
        >
          <Download size={16} /> {exporting ? 'Preparing…' : 'Download my data'}
        </button>
        {exportError && (
          <p role="alert" className="mt-2 text-sm text-semantic-danger-700 dark:text-semantic-danger-dark">
            {exportError}
          </p>
        )}
      </div>
    </div>
  );
};

export default AccountCard;
