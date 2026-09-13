import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import AuthField from '../../components/ui/AuthField';
import { forgotPassword } from '../../services/authService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await forgotPassword(email);
      // The backend always responds the same way whether or not the email is
      // registered — don't reveal that here either.
      setSent(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <>
        <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
          <CheckCircle2 size={20} />
          <h2 className="font-display text-xl font-bold text-light-text dark:text-white">Check your email</h2>
        </div>
        <p className="mt-3 text-sm text-light-muted dark:text-dark-muted">
          If an account exists for <strong>{email}</strong>, a password reset link is on its way. It expires in 30 minutes.
        </p>
        <Link to="/login" className="mt-6 inline-block text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
          Back to log in
        </Link>
      </>
    );
  }

  return (
    <>
      <h2 className="font-display text-display font-bold text-light-text dark:text-white">Reset your password</h2>
      <p className="mt-2 mb-8 text-light-muted dark:text-dark-muted">
        Enter your email and we'll send you a link to set a new password.
      </p>

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <AuthField
          label="Email"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(''); }}
          error={error}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-gradient py-3 font-semibold text-white shadow-brand-sm transition hover:shadow-brand disabled:opacity-60"
        >
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-light-muted dark:text-dark-muted">
        <Link to="/login" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
          Back to log in
        </Link>
      </p>
    </>
  );
};

export default ForgotPassword;
