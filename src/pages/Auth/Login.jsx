import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import AuthField from '../../components/ui/AuthField';
import GoogleSignInButton from '../../components/ui/GoogleSignInButton';
import { login as loginRequest } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [searchParams] = useSearchParams();
  // Google's OAuth flow reports failure via a redirect back to /login?error=google
  // (see motive-backend's auth.controller.js#googleCallback) rather than a
  // normal AJAX error, since the whole flow is top-level navigations.
  const [serverError, setServerError] = useState(
    searchParams.get('error') === 'google' ? 'Google sign-in failed. Please try again.' : ''
  );
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login: setAuthUser } = useAuth();

  const setField = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setServerError('');
  };

  const validate = () => {
    const next = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email';
    if (!form.password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError('');
    try {
      const { data } = await loginRequest(form);
      setAuthUser(data.user, data.accessToken);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="font-display text-display font-bold text-light-text dark:text-white">Welcome back</h2>
      <p className="mt-2 mb-8 text-light-muted dark:text-dark-muted">Log in to your Motive workspace.</p>

      {serverError && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
          <AlertCircle size={16} /> {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <AuthField
          label="Email"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={setField('email')}
          error={errors.email}
        />
        <AuthField
          label="Password"
          icon={Lock}
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={form.password}
          onChange={setField('password')}
          error={errors.password}
        />
        <div className="text-right -mt-2">
          <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-gradient py-3 font-semibold text-white shadow-brand-sm transition hover:shadow-brand disabled:opacity-60"
        >
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-light-muted dark:text-dark-muted">
        <div className="h-px flex-1 bg-light-border dark:bg-dark-border" />
        or
        <div className="h-px flex-1 bg-light-border dark:bg-dark-border" />
      </div>
      <GoogleSignInButton />

      <p className="mt-8 text-center text-sm text-light-muted dark:text-dark-muted">
        Don’t have an account?{' '}
        <Link to="/register" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
          Sign up
        </Link>
      </p>
    </>
  );
};

export default Login;
