import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, AlertCircle } from 'lucide-react';
import AuthLayout from '../../layout/AuthLayout';
import AuthField from '../../components/AuthField';
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
const STRENGTH_COLOR = ['', 'bg-red-400', 'bg-amber-400', 'bg-lime-400', 'bg-emerald-500'];

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
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
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError('');
    try {
      const { data } = await registerRequest(form);
      // Backend returns an access token on register → log the user straight in.
      setAuthUser(data.user, data.accessToken);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(err?.response?.data?.message || 'Could not create your account.');
    } finally {
      setLoading(false);
    }
  };

  const s = strength(form.password);

  return (
    <AuthLayout>
      <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white">
        Create your account
      </h2>
      <p className="mt-2 mb-8 text-gray-500 dark:text-gray-400">Start organizing in seconds.</p>

      {serverError && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
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
                    className={`flex-1 rounded-full ${i <= s ? STRENGTH_COLOR[s] : 'bg-gray-200 dark:bg-[#2A2733]'}`}
                  />
                ))}
              </div>
              <span className="w-12 text-right text-xs text-gray-500">{STRENGTH_LABEL[s]}</span>
            </div>
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

      <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Register;
