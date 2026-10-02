import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { User } from 'lucide-react';

// The avatar dropdown at the top of Settings: Profile and Logout. Written by hand
// because it replaces @headlessui/react, which was used for this one menu and,
// with the positioning libraries it drags in, made up about three quarters of the
// Settings page's JavaScript. Behaviour follows the standard menu-button pattern:
// aria-haspopup/aria-expanded on the button, role=menu with menuitems, focus moves
// to the first item on open, arrows move and wrap, Escape closes and returns
// focus to the button, and a click outside closes it.
const AccountMenu = ({ name, onLogout }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const items = () => [...(menuRef.current?.querySelectorAll('[role="menuitem"]') || [])];

  useEffect(() => {
    if (!open) return undefined;
    items()[0]?.focus();
    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const close = (returnFocus = false) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  };

  const onMenuKeyDown = (e) => {
    const list = items();
    const index = list.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      list[(index + 1) % list.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      list[(index - 1 + list.length) % list.length]?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close(true);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  const itemClass =
    'block w-full rounded-md px-4 py-2 text-left transition duration-300 text-light-text hover:bg-brand-100 hover:text-brand-700 focus:bg-brand-100 focus:text-brand-700 focus:outline-none dark:text-dark-text dark:hover:bg-brand-800 dark:hover:text-white dark:focus:bg-brand-800 dark:focus:text-white';

  return (
    <div ref={rootRef} className="relative z-50 inline-block text-left">
      <button
        ref={buttonRef}
        type="button"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white transition duration-300 hover:bg-brand-600"
      >
        {name ? name.charAt(0).toUpperCase() : <User size={20} aria-hidden="true" />}
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Account"
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 mt-2 w-44 rounded-xl border border-light-border bg-light-surface py-1 text-sm shadow-xl dark:border-dark-border dark:bg-dark-raised"
        >
          <Link role="menuitem" to="/profile" className={itemClass} onClick={() => close()}>
            Profile
          </Link>
          <button
            type="button"
            role="menuitem"
            className={`${itemClass} font-medium text-brand-600 dark:text-brand-300`}
            onClick={() => {
              close();
              onLogout();
            }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountMenu;
