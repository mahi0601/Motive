import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { FiHome, FiCalendar, FiBarChart2, FiSettings, FiGrid } from 'react-icons/fi';
import PageTree from './PageTree';
import Logo from './Logo';

const Sidebar = () => {
  // Drawer state only matters on mobile; on lg+ the sidebar is always visible.
  const [isOpen, setIsOpen] = useState(false);
  const closeOnMobile = () => setIsOpen(false);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <FiHome /> },
    { name: 'Calendar', path: '/calendar', icon: <FiCalendar /> },
    { name: 'Statistics', path: '/stats', icon: <FiBarChart2 /> },
    { name: 'Templates', path: '/templates', icon: <FiGrid /> },
    { name: 'Settings', path: '/settings', icon: <FiSettings /> },
  ];

  return (
    <>
      {/* Mobile open button — hidden on desktop where the sidebar is persistent */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-3 left-3 z-50 rounded-lg border border-gray-200 bg-white/90 p-2 text-gray-700 shadow-md backdrop-blur lg:hidden dark:border-[#2A2733] dark:bg-[#1a1a1a]/90 dark:text-gray-200"
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
        className={`fixed top-0 left-0 z-40 flex h-screen w-64 flex-col overflow-y-auto border-r border-gray-200 bg-white px-5 py-6 shadow-xl transition-transform duration-300 ease-in-out dark:border-gray-700 dark:bg-[#1a1a1a]
          lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="mb-8 flex items-center justify-between">
          <NavLink to="/" onClick={closeOnMobile} className="transition-transform hover:scale-[1.02]">
            <Logo size={30} />
          </NavLink>
          {/* Close button only on mobile */}
          <button
            onClick={closeOnMobile}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 lg:hidden dark:text-gray-300 dark:hover:bg-white/5"
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
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'
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
