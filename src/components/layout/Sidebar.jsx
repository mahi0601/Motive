import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart2, Calendar, Grid, Home, Menu, Settings, X } from 'lucide-react';
import PageTree from '../editor/PageTree';
import Logo from '../ui/Logo';

const Sidebar = () => {
  // Drawer state only matters on mobile; on lg+ the sidebar is always visible.
  const [isOpen, setIsOpen] = useState(false);
  const closeOnMobile = () => setIsOpen(false);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <Home /> },
    { name: 'Calendar', path: '/calendar', icon: <Calendar /> },
    { name: 'Statistics', path: '/stats', icon: <BarChart2 /> },
    { name: 'Templates', path: '/templates', icon: <Grid /> },
    { name: 'Settings', path: '/settings', icon: <Settings /> },
  ];

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
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                onClick={closeOnMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition
                  ${
                    isActive
                      ? 'bg-brand-gradient text-white shadow-brand-sm'
                      : 'text-light-text hover:bg-light-border/40 dark:text-dark-muted dark:hover:bg-white/5'
                  }`
                }
              >
                {item.icon}
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Notion-style nested page tree */}
        <PageTree onNavigate={closeOnMobile} />
      </aside>
    </>
  );
};

export default Sidebar;
