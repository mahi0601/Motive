import { invitePath } from '../../utils/returnTo';
import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { User, Mail, Lock, AlertCircle } from 'lucide-react';
import AuthField from '../../components/ui/AuthField';
import GoogleSignInButton from '../../components/ui/GoogleSignInButton';
import { register as registerRequest } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

const strength = (pw) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/\d/.test(pw)) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0..4
};
const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong'];
// Routed through statusColors.js's semantic scale instead of stock Tailwind
// red/amber/lime/emerald, so this meter uses the exact same "danger →
// warning → success" hues as the rest of the app.
const STRENGTH_COLOR = ['', 'bg-semantic-danger-500', 'bg-semantic-warning-500', 'bg-brand-400', 'bg-semantic-success-500'];

const Register = () => {
  const [searchParams] = useSearchParams();
  // Arriving from an invite link prefills the email it was sent to — see
  // Invite.jsx, which builds this URL.
  const [form, setForm] = useState({ name: '', email: searchParams.get('email') || '', password: '' });
  // The age and terms confirmation. Never pre-ticked, and the server refuses a
  // sign-up without it (it records when and which version).
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
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
    if (!form.name.trim()) next.name = 'Name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email';
    if (form.password.length < 8) next.password = 'At least 8 characters';
    else if (!/\d/.test(form.password)) next.password = 'Include at least one number';
    if (!acceptTerms) next.terms = 'Please confirm you are 16 or older and agree to the Terms and Privacy Policy';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError('');
    try {
      const { data } = await registerRequest({ ...form, acceptTerms: true });
      // Backend returns an access token on register → log the user straight in.
      setAuthUser(data.user, data.accessToken);
      // Same hand-off as Login.jsx: let Invite.jsx do the actual accept once
      // this person is authenticated, rather than duplicating that here.
      const inviteToken = searchParams.get('invite');
      navigate(invitePath(inviteToken) || '/dashboard', { replace: true });
    } catch (err) {
      setServerError(err?.response?.data?.message || 'Could not create your account.');
    } finally {
      setLoading(false);
    }
  };

  const s = strength(form.password);

  return (
    <>
      <h2 className="font-display text-display font-bold text-light-text dark:text-white">
        Create your account
      </h2>
      <p className="mt-2 mb-8 text-light-muted dark:text-dark-muted">Start organizing in seconds.</p>

      {serverError && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-semantic-danger-200 bg-semantic-danger-50 px-4 py-3 text-sm text-semantic-danger-700 dark:border-semantic-danger-500/30 dark:bg-semantic-danger-500/10 dark:text-semantic-danger-dark">
          <AlertCircle size={16} /> {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <AuthField
          label="Full name"
          icon={User}
          autoComplete="name"
          placeholder="Jane Doe"
          value={form.name}
          onChange={setField('name')}
          error={errors.name}
        />
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
        <div>
          <AuthField
            label="Password"
            icon={Lock}
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters, 1 number"
            value={form.password}
            onChange={setField('password')}
            error={errors.password}
          />
          {form.password && !errors.password && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex h-1.5 flex-1 gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-full ${i <= s ? STRENGTH_COLOR[s] : 'bg-light-border dark:bg-dark-border'}`}
                  />
                ))}
              </div>
              <span className="w-12 text-right text-xs text-light-muted dark:text-dark-muted">{STRENGTH_LABEL[s]}</span>
            </div>
          )}
        </div>

        <div>
          <label className="flex items-start gap-2 text-sm text-light-muted dark:text-dark-muted">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => {
                setAcceptTerms(e.target.checked);
                setErrors((prev) => ({ ...prev, terms: undefined }));
              }}
              aria-invalid={!!errors.terms}
              aria-describedby={errors.terms ? 'terms-error' : undefined}
              className="mt-0.5 h-4 w-4 rounded border-light-border text-brand-600 focus:ring-brand-500"
            />
            <span>
              I am 16 or older and agree to the{' '}
              <Link to="/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-brand-600 hover:underline dark:text-brand-400">Terms</Link>
              {' '}and{' '}
              <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="font-medium text-brand-600 hover:underline dark:text-brand-400">Privacy Policy</Link>.
            </span>
          </label>
          {errors.terms && (
            <p id="terms-error" role="alert" className="mt-1 text-xs text-semantic-danger-700 dark:text-semantic-danger-dark">{errors.terms}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-gradient py-3 font-semibold text-white shadow-brand-sm transition hover:shadow-brand disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-light-muted dark:text-dark-muted">
        <div className="h-px flex-1 bg-light-border dark:bg-dark-border" />
        or
        <div className="h-px flex-1 bg-light-border dark:bg-dark-border" />
      </div>
      <GoogleSignInButton inviteToken={searchParams.get('invite')} />
      <p className="mt-2 text-center text-xs text-light-muted dark:text-dark-muted">
        By continuing with Google you agree to the{' '}
        <Link to="/terms" target="_blank" rel="noopener noreferrer" className="hover:underline">Terms</Link> and{' '}
        <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="hover:underline">Privacy Policy</Link>.
      </p>

      <p className="mt-8 text-center text-sm text-light-muted dark:text-dark-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
          Log in
        </Link>
      </p>
    </>
  );
};

export default Register;
