import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiX, FiCheckSquare, FiFileText, FiLayout, FiCommand } from 'react-icons/fi';

const STORAGE_KEY = 'motive_onboarded';

// Shown once for a genuinely new account (see Dashboard.jsx: only rendered
// when the user has zero tasks yet) — dismissing it (any way) sets a
// per-browser flag so it never reappears.
export const hasSeenWelcome = () => localStorage.getItem(STORAGE_KEY) === 'true';
const markSeen = () => localStorage.setItem(STORAGE_KEY, 'true');

const STEPS = [
  {
    icon: FiCheckSquare,
    title: 'Organize tasks your way',
    body: 'Drag tasks between Personal, Work, Health, and Development boards. Track priority, due dates, and completion at a glance.',
  },
  {
    icon: FiFileText,
    title: 'Write in Notion-style pages',
    body: "Type '/' in any page to insert headings, lists, to-dos, tables, or embeds. Select text for bold, italic, and code formatting.",
  },
  {
    icon: FiCommand,
    title: 'Cmd+K for everything',
    body: 'Jump to any page or section instantly — search, navigate, and create without touching your mouse.',
  },
  {
    icon: FiLayout,
    title: 'Start from a template',
    body: 'Meeting notes, project plans, and more — pre-built templates to get moving in seconds.',
  },
];

const WelcomeModal = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const dismiss = () => {
    markSeen();
    onClose();
  };

  const finish = (path) => {
    markSeen();
    onClose();
    if (path) navigate(path);
  };

  const { icon: Icon, title, body } = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={dismiss}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md rounded-2xl border shadow-2xl"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--surface-border)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b p-4" style={{ borderColor: 'var(--surface-border)' }}>
            <span className="text-sm font-semibold text-brand-500">Welcome to Motive</span>
            <button onClick={dismiss} className="rounded p-1 hover:bg-black/10" aria-label="Close">
              <FiX className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>

          <div className="p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gradient text-white">
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-bold" style={{ color: 'var(--text)' }}>{title}</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{body}</p>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-brand-500' : 'w-1.5 bg-gray-300 dark:bg-gray-600'}`}
                  />
                ))}
              </div>
              {isLast ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => finish('/templates')}
                    className="rounded-lg border px-3 py-1.5 text-sm font-medium"
                    style={{ borderColor: 'var(--surface-border)', color: 'var(--text)' }}
                  >
                    Browse templates
                  </button>
                  <button
                    onClick={() => finish(null)}
                    className="rounded-lg bg-brand-gradient px-3 py-1.5 text-sm font-medium text-white shadow-sm"
                  >
                    Get started
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  className="rounded-lg bg-brand-gradient px-4 py-1.5 text-sm font-medium text-white shadow-sm"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WelcomeModal;
