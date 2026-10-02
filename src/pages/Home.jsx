import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Link2, AlertTriangle, Users } from 'lucide-react';
import { LogoMark } from '../components/ui/Logo';
import { BRAND, VALUE_PROPS } from '../config/brand';
import { PLANS, PLAN_ORDER, planBenefits } from '../config/plans';

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

        {/* Pricing — placeholder numbers (config/plans.js) until they are checked with
            real buyers. No trial, discount or "most popular" claim is made. */}
        <section aria-labelledby="pricing-heading" className="space-y-6">
          <div className="text-center space-y-2">
            <h2 id="pricing-heading" className="font-display text-2xl md:text-3xl font-bold">Pricing</h2>
            <p className="text-sm text-light-muted dark:text-dark-muted max-w-xl mx-auto">
              Priced by active client page. Your clients never need an account or a seat.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLAN_ORDER.map((key) => {
              const plan = PLANS[key];
              return (
                <div
                  key={key}
                  className="flex flex-col bg-light-surface dark:bg-dark-raised border border-light-border dark:border-dark-border rounded-xl p-6 shadow-sm"
                >
                  <h3 className="text-lg font-semibold text-light-text dark:text-dark-text">{plan.name}</h3>
                  <p className="text-sm text-light-muted dark:text-dark-muted">{plan.blurb}</p>
                  <div className="mt-3 text-light-text dark:text-dark-text">
                    <p className="text-2xl font-bold">{plan.price.usd} / month</p>
                    <p className="text-sm text-light-muted dark:text-dark-muted">{plan.price.inr} / month</p>
                  </div>
                  <ul className="mt-4 flex-1 space-y-2 text-sm text-light-text dark:text-dark-text">
                    {planBenefits(key).map((line) => (
                      <li key={line} className="flex items-start gap-2">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                        {line}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/register"
                    className="mt-5 px-4 py-2 rounded-lg border border-brand-600 text-brand-600 text-center text-sm font-medium transition hover:bg-brand-600 hover:text-white dark:border-white dark:text-white"
                  >
                    {key === 'free' ? 'Start free' : `Get ${plan.name}`}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

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
