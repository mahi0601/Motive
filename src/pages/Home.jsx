import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Link2, AlertTriangle, Users } from 'lucide-react';
import { LogoMark } from '../components/ui/Logo';
import { BRAND, VALUE_PROPS } from '../config/brand';

// One icon per VALUE_PROPS entry, in order — kept alongside the copy in
// brand.js so a reorder there doesn't silently misalign icons and text.
const VALUE_ICONS = [Link2, AlertTriangle, Users];

const Home = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-light-background dark:bg-dark-background text-light-text dark:text-dark-text px-6 py-12 font-inter"
    >
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Header Section */}
        <div className="text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-col justify-center items-center gap-4"
          >
            <LogoMark size={64} />
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 dark:border-brand-800 bg-brand-soft px-4 py-1 text-xs font-medium uppercase tracking-wider text-brand-700 dark:text-brand-300">
              {BRAND.eyebrow}
            </span>
            <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight text-light-text dark:text-dark-text max-w-3xl">
              {BRAND.tagline}
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-lg md:text-xl text-light-muted dark:text-dark-muted max-w-2xl mx-auto"
          >
            {BRAND.subhead}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex justify-center gap-4 flex-wrap mt-4"
          >
            <Link
              to="/login"
              className="px-6 py-3 rounded-xl border border-light-border dark:border-dark-border text-light-text dark:text-dark-text hover:bg-light-border/40 dark:hover:bg-dark-raised transition-all duration-300 text-sm font-medium shadow-sm hover:shadow-lg"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-6 py-3 rounded-xl bg-brand-gradient text-white font-semibold transition duration-300 text-sm flex items-center gap-2 shadow-brand-sm hover:shadow-brand"
            >
              Get Started <ArrowRight />
            </Link>
          </motion.div>
        </div>

        {/* Value props — replaces the four life-area template cards
            (Personal/Development/Health/Finance), which all linked to
            /login regardless of which one you clicked and reflected the old
            consumer positioning. These three are the actual pitch. */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6"
        >
          {VALUE_PROPS.map((prop, index) => {
            const Icon = VALUE_ICONS[index];
            return (
              <div
                key={prop.title}
                className="bg-light-surface dark:bg-dark-raised border border-light-border dark:border-dark-border rounded-xl p-6 shadow-sm flex flex-col gap-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-light-text dark:text-dark-text">{prop.title}</h3>
                <p className="text-sm text-light-muted dark:text-dark-muted">{prop.body}</p>
              </div>
            );
          })}
        </motion.div>

        {/* Closing line — deliberately not a fabricated testimonial. */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="text-sm text-light-muted dark:text-dark-muted text-center pt-4"
        >
          Fewer status calls. More shipped work.
        </motion.p>
      </div>
    </motion.div>
  );
};

export default Home;
