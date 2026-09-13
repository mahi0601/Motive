
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, FolderPlus, Search } from 'lucide-react';
import { LogoMark } from '../components/ui/Logo';

const templates = [
  {
    title: 'Personal',
    description: 'Organize your personal to-dos, errands, and habits in one clean view.',
    link: '/login',
  },
  {
    title: 'Development',
    description: 'Ship client work and side projects — track scope, deadlines, and progress without the overhead.',
    link: '/login',
  },
  {
    title: 'Health & Wellness',
    description: 'Track your fitness, meals, and self-care routines effortlessly.',
    link: '/login',
  },
  {
    title: 'Finance',
    description: 'Budget, track expenses, and build smarter saving habits.',
    link: '/login',
  },
];

const Home = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-light-background dark:bg-dark-background text-light-text dark:text-dark-text px-6 py-12 font-inter"
    >
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header Section */}
        <div className="text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-col justify-center items-center gap-4"
          >
            <LogoMark size={72} />
            <h1 className="font-display text-5xl md:text-7xl font-extrabold tracking-tight text-light-text dark:text-dark-text">
              Motive
            </h1>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 dark:border-brand-800 bg-brand-soft px-4 py-1 text-xs font-medium uppercase tracking-wider text-brand-600 dark:text-brand-300">
              Momentum you can actually see
            </span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-lg md:text-xl text-light-muted dark:text-dark-muted max-w-2xl mx-auto"
          >
            No databases to design, no workspace to configure — just capture what matters,
            and watch the streaks and stats show you the momentum you're already building.
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

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="relative max-w-xl mx-auto"
        >
          <Search className="absolute top-3.5 left-4 text-light-muted dark:text-dark-muted text-base" />
          <input
            type="text"
            placeholder="Search templates or ideas..."
            className="w-full pl-10 pr-4 py-3 border border-light-border dark:border-dark-border rounded-xl bg-light-surface dark:bg-dark-raised text-sm text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500 transition duration-300"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {templates.map((template, index) => (
            <Link
              key={index}
              to={template.link}
              className="bg-light-surface dark:bg-dark-raised border border-light-border dark:border-dark-border rounded-xl p-6 shadow hover:shadow-xl hover:ring-1 hover:ring-brand-500 transition-all duration-300 flex flex-col gap-3 group"
            >
              <div className="flex items-center gap-3">
                <FolderPlus className="text-brand-500 text-lg group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-lg font-semibold text-light-text dark:text-dark-text">{template.title}</h3>
              </div>
              <p className="text-sm text-light-muted dark:text-dark-muted">
                {template.description}
              </p>
              <span className="mt-auto text-sm text-brand-600 group-hover:underline dark:text-brand-400">
                Explore →
              </span>
            </Link>
          ))}
        </motion.div>

        {/* Quote Footer */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-sm text-light-muted dark:text-dark-muted italic text-center pt-12"
        >
          “Productivity is never an accident. It is always the result of intelligent planning, effort, and consistency.”
        </motion.p>
      </div>
    </motion.div>
  );
};

export default Home;
