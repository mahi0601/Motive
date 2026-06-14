import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Zap, Layers } from 'lucide-react';
import { LogoMark } from '../components/Logo';

const points = [
  { icon: Layers, text: 'Block-based pages — write, plan, and organize in one place.' },
  { icon: CheckCircle2, text: 'Tasks, boards, and calendar that stay in sync.' },
  { icon: Zap, text: 'Fast, real-time, and built to scale with your team.' },
];

/**
 * Full-bleed split-panel auth shell: brand story on the left, form on the right.
 * Pages pass their form as children.
 */
const AuthLayout = ({ children }) => (
  <div className="flex min-h-screen w-full bg-white dark:bg-[#0b0a0f]">
    {/* Brand panel (hidden on small screens) */}
    <div className="relative hidden w-1/2 overflow-hidden bg-brand-gradient lg:flex lg:flex-col lg:justify-between p-12 text-white">
      <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-white/10 blur-2xl" />

      <div className="relative flex items-center gap-3">
        <LogoMark size={40} />
        <span className="font-display text-2xl font-bold">Motive</span>
      </div>

      <div className="relative">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-display text-4xl font-extrabold leading-tight"
        >
          Turn intent into momentum.
        </motion.h1>
        <p className="mt-4 max-w-md text-white/80">
          A calm, fast workspace where your notes, tasks, and plans finally live together.
        </p>

        <ul className="mt-10 space-y-4">
          {points.map(({ icon: Icon, text }, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="flex items-start gap-3 text-sm text-white/90"
            >
              <Icon size={20} className="mt-0.5 shrink-0" />
              <span>{text}</span>
            </motion.li>
          ))}
        </ul>
      </div>

      <p className="relative text-xs text-white/60">© {new Date().getFullYear()} Motive</p>
    </div>

    {/* Form panel */}
    <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md"
      >
        {/* Brand logo above the form — visible on every screen size */}
        <Link to="/" className="mb-8 flex items-center gap-2.5">
          <LogoMark size={36} />
          <span className="font-display text-2xl font-bold text-gray-900 dark:text-white">
            Motive
          </span>
        </Link>
        {children}
        <p className="mt-8 text-center text-xs text-gray-400">
          <Link to="/privacy" className="hover:text-brand-600 dark:hover:text-brand-400">
            Privacy Policy
          </Link>
        </p>
      </motion.div>
    </div>
  </div>
);

export default AuthLayout;
