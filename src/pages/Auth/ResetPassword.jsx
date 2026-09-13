import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import AuthField from '../../components/ui/AuthField';
import { resetPassword } from '../../services/authService';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return setError('At least 8 characters');
    if (!/\d/.test(password)) return setError('Include at least one number');
    if (password !== confirm) return setError('Passwords do not match');

    setLoading(true);
    setError('');
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (err) {
      setError(err?.response?.data?.message || 'This reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <>
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle size={20} />
          <h2 className="font-display text-xl font-bold text-light-text dark:text-white">Invalid link</h2>
        </div>
        <p className="mt-3 text-sm text-light-muted dark:text-dark-muted">
          This reset link is missing its token. Request a new one below.
        </p>
        <Link to="/forgot-password" className="mt-6 inline-block text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
          Request a new link
        </Link>
      </>
    );
  }

  if (done) {
    return (
      <>
        <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
          <CheckCircle2 size={20} />
          <h2 className="font-display text-xl font-bold text-light-text dark:text-white">Password updated</h2>
        </div>
        <p className="mt-3 text-sm text-light-muted dark:text-dark-muted">Redirecting you to log in…</p>
      </>
    );
  }

  return (
    <>
      <h2 className="font-display text-display font-bold text-light-text dark:text-white">Set a new password</h2>
      <p className="mt-2 mb-8 text-light-muted dark:text-dark-muted">
        This also signs you out everywhere else, as a precaution.
      </p>

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <AuthField
          label="New password"
          icon={Lock}
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters, 1 number"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(''); }}
        />
        <AuthField
          label="Confirm password"
          icon={Lock}
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter your new password"
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); setError(''); }}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-gradient py-3 font-semibold text-white shadow-brand-sm transition hover:shadow-brand disabled:opacity-60"
        >
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </>
  );
};

export default ResetPassword;
