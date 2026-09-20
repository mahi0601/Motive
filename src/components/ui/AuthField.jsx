import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const AuthField = ({ label, icon: Icon, type = 'text', error, ...props }) => {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (show ? 'text' : 'password') : type;

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-light-text dark:text-dark-muted">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-light-muted dark:text-dark-muted"
          />
        )}
        <input
          type={inputType}
          className={`w-full rounded-lg border bg-light-surface py-2.5 text-light-text outline-none transition
            placeholder:text-light-muted dark:bg-dark-surface dark:text-dark-text
            ${Icon ? 'pl-10' : 'pl-3.5'} ${isPassword ? 'pr-10' : 'pr-3.5'}
            ${
              error
                ? 'border-semantic-danger-200 dark:border-semantic-danger-500/40 focus:ring-2 focus:ring-semantic-danger-200 dark:focus:ring-semantic-danger-500/30'
                : 'border-light-border focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-dark-border'
            }`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 !border-0 !bg-transparent !p-0 !shadow-none text-brand-500 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
            tabIndex={-1}
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-semantic-danger-500 dark:text-semantic-danger-dark">{error}</p>}
    </div>
  );
};

export default AuthField;
