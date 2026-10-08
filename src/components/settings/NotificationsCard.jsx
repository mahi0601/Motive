import React, { useId, useState } from 'react';
import { Bell, CheckCircle, Mail } from 'lucide-react';
import { CARD_CLASS } from './cardStyles';
import { useAuth } from '../../context/AuthContext';
import { updateProfile } from '../../services/userService';

// Previously a bare `alert('Email notifications enabled successfully!')`
// that did nothing — no request, no persisted setting. There's no email
// notification pipeline to wire this to yet, so the honest fix is to make the
// button do the one real thing available today: request OS/browser
// notification permission, which is what actually gates whether a
// `notification:new` socket push can also show as a native browser
// notification.
const NotificationsCard = () => {
  const { user, refreshUser } = useAuth();
  const emailId = useId();
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailError, setEmailError] = useState('');
  // On unless switched off: an account from before this setting has no value, which means on.
  const emailOn = user?.notifyClientResponsesByEmail !== false;
  const handleEmailToggle = async (e) => {
    setEmailBusy(true);
    setEmailError('');
    try {
      await updateProfile({ notifyClientResponsesByEmail: e.target.checked });
      await refreshUser();
    } catch {
      setEmailError('Could not save. Try again.');
    } finally {
      setEmailBusy(false);
    }
  };
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  const handleEnableAlerts = async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
  };

  return (
    <div className={CARD_CLASS}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="text-brand-500" />
          <h4 className="text-lg font-semibold">Notifications</h4>
        </div>
        {notifPermission === 'granted' ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-semantic-success-50 text-semantic-success-700 dark:bg-semantic-success-500/10 dark:text-semantic-success-dark">
            <CheckCircle /> Enabled
          </span>
        ) : (
          <button
            onClick={handleEnableAlerts}
            disabled={notifPermission === 'denied' || notifPermission === 'unsupported'}
            className="px-4 py-2 text-sm rounded-lg font-medium bg-light-surface dark:bg-transparent text-brand-600 border border-brand-600 hover:bg-brand-600 hover:text-white hover:border-transparent transition-all duration-300 shadow-sm hover:shadow-md dark:text-white dark:border-white disabled:opacity-60 disabled:hover:bg-light-surface disabled:hover:text-brand-600 dark:disabled:hover:bg-transparent"
          >
            <Mail className="inline-block mr-1" /> Enable Alerts
          </button>
        )}
      </div>
      <p className="text-sm text-light-muted dark:text-dark-muted mt-2">
        {notifPermission === 'denied'
          ? 'Blocked in your browser settings — allow notifications for this site to enable.'
          : notifPermission === 'unsupported'
          ? 'Not supported in this browser.'
          : 'Show a desktop notification when Clientglass notifies you (comments, mentions).'}
      </p>
      <label htmlFor={emailId} className="mt-4 flex items-center gap-2 text-sm text-light-text dark:text-dark-text">
        <input id={emailId} type="checkbox" checked={emailOn} disabled={emailBusy} onChange={handleEmailToggle} />
        Email me when a client responds
      </label>
      <p className="mt-1 text-xs text-light-muted dark:text-dark-muted">
        Approvals arrive straight away. Comments and requests are grouped, at most one email per client every 12 hours.
      </p>
      {emailError && <p role="alert" className="mt-1 text-sm text-semantic-danger-700 dark:text-semantic-danger-dark">{emailError}</p>}
    </div>
  );
};

export default NotificationsCard;
