import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { verifyEmail } from '../../services/authService';

// Landing page for the link in the confirmation email. Works signed in or out:
// the token alone proves the address.
const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  // Read once and strip it from the address bar, like the reset-password page.
  const [token] = useState(() => searchParams.get('token') || '');
  const navigate = useNavigate();
  const [status, setStatus] = useState(token ? 'working' : 'invalid');
  const started = useRef(false);

  useEffect(() => {
    if (searchParams.has('token')) navigate('/verify-email', { replace: true });
  }, [navigate, searchParams]);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true; // StrictMode runs effects twice in dev; the link should be used once
    verifyEmail(token)
      .then(() => setStatus('done'))
      .catch(() => setStatus('invalid'));
  }, [token]);

  if (status === 'working') {
    return <p className="text-light-muted dark:text-dark-muted">Confirming your email…</p>;
  }
  if (status === 'done') {
    return (
      <>
        <div className="flex items-center gap-2 text-brand-600 dark:text-brand-300">
          <CheckCircle2 size={20} /> <h2 className="font-display text-display font-bold">Email confirmed</h2>
        </div>
        <p className="mt-3 text-light-muted dark:text-dark-muted">You can now invite teammates to your workspaces.</p>
        <Link to="/dashboard" className="mt-6 inline-block font-medium text-brand-600 dark:text-brand-300">
          Continue to Motive
        </Link>
      </>
    );
  }
  return (
    <>
      <div className="flex items-center gap-2 text-semantic-danger-700 dark:text-semantic-danger-dark">
        <AlertCircle size={20} /> <h2 className="font-display text-display font-bold">Link not valid</h2>
      </div>
      <p className="mt-3 text-light-muted dark:text-dark-muted">
        This confirmation link is invalid or has expired. Sign in and choose "Resend confirmation email" in Settings.
      </p>
      <Link to="/login" className="mt-6 inline-block font-medium text-brand-600 dark:text-brand-300">
        Go to sign in
      </Link>
    </>
  );
};

export default VerifyEmail;
