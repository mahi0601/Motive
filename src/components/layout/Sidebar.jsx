import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { PRIMARY_NAV, SECONDARY_NAV } from '../../config/nav';
import PageTree from '../editor/PageTree';
import Logo from '../ui/Logo';

const Sidebar = () => {
  // Drawer state only matters on mobile; on lg+ the sidebar is always visible.
  const [isOpen, setIsOpen] = useState(false);
  const closeOnMobile = () => setIsOpen(false);

  return (
    <>
      {/* Mobile open button — hidden on desktop where the sidebar is persistent */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed left-3 top-[calc(0.75rem+env(safe-area-inset-top))] z-50 rounded-lg border border-light-border bg-light-surface/90 p-2 text-light-text shadow-md backdrop-blur lg:hidden dark:border-dark-border dark:bg-dark-surface/90 dark:text-dark-text"
          title="Open menu"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {/* Backdrop (mobile only, when open) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={closeOnMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 flex h-screen w-64 flex-col overflow-y-auto border-r border-light-border bg-light-surface px-5 pb-6 pt-[calc(1.5rem+env(safe-area-inset-top))] shadow-xl transition-transform duration-300 ease-in-out dark:border-dark-border dark:bg-dark-surface
          lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="mb-8 flex items-center justify-between">
          <NavLink to="/" onClick={closeOnMobile} className="transition-transform hover:scale-[1.02]">
            <Logo size={30} />
          </NavLink>
          {/* Close button only on mobile */}
          <button
            onClick={closeOnMobile}
            className="rounded-md p-2 text-light-muted hover:bg-light-border/40 lg:hidden dark:text-dark-muted dark:hover:bg-white/5"
            title="Close menu"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ul className="space-y-1.5">
          {PRIMARY_NAV.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                onClick={closeOnMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition
                  ${
                    isActive
                      ? 'border-l-2 border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                      : 'border-l-2 border-transparent text-light-text hover:bg-light-border/40 dark:text-dark-muted dark:hover:bg-white/5'
                  }`
                }
              >
                <item.Icon className="h-[18px] w-[18px]" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Notion-style nested page tree ("Docs") */}
        <PageTree onNavigate={closeOnMobile} />

        {/* Occasional destinations — deliberately de-emphasized (smaller,
            muted, no active-gradient treatment) so they read as secondary
            to the primary nav above. See config/nav.js. */}
        <ul className="mt-auto space-y-1 border-t border-light-border pt-3 dark:border-dark-border">
          {SECONDARY_NAV.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                onClick={closeOnMobile}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-4 py-2 text-xs font-medium transition
                  ${
                    isActive
                      ? 'text-brand-600 dark:text-brand-400'
                      : 'text-light-muted hover:text-light-text dark:text-dark-muted dark:hover:text-dark-text'
                  }`
                }
              >
                <item.Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
};

export default Sidebar;
