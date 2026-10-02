import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Command, FileText, Layout, Link2, X } from 'lucide-react';
import { markWelcomeSeen as markSeen } from '../../utils/welcome';

// Shown once for a genuinely new account (see Dashboard.jsx: only rendered
// when the user has zero tasks yet) — dismissing it (any way) sets a
// per-browser flag (utils/welcome.js) so it never reappears.

const STEPS = [
  {
    icon: CheckSquare,
    title: 'Run client work on a board',
    body: 'Drag tasks between boards, set priority and due dates, and see what is slipping at a glance.',
  },
  {
    icon: Link2,
    title: 'Give each client a live link',
    body: 'In Settings, turn on a status link. Your client sees task titles, status and dates, with no sign-up, and never names, emails, comments or files.',
  },
  {
    icon: FileText,
    title: 'Write in Notion-style pages',
    body: "Type '/' in any page to insert headings, lists, to-dos, tables, or embeds. Select text for bold, italic, and code formatting.",
  },
  {
    icon: Command,
    title: 'Cmd+K for everything',
    body: 'Jump to any page or section instantly — search, navigate, and create without touching your mouse.',
  },
  {
    icon: Layout,
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

  // Dialog behaviour: Escape closes it, and focus moves into it when it opens
  // (and back where it was when it closes), so keyboard and screen-reader
  // users are not left behind the overlay.
  const panelRef = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    panelRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        markSeen();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Welcome to Clientglass"
          tabIndex={-1}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md rounded-2xl border shadow-2xl outline-none"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--surface-border)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b p-4" style={{ borderColor: 'var(--surface-border)' }}>
            <span className="text-sm font-semibold text-brand-500">Welcome to Clientglass</span>
            <button onClick={dismiss} className="rounded p-1 hover:bg-black/10" aria-label="Close">
              <X className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>

          <div className="p-6">
            {/* Tonal, not gradient — this is a decorative step icon, not the
                action; "Next"/"Get started" below is the one CTA this
                screen spends its gradient on. */}
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-bold" style={{ color: 'var(--text)' }}>{title}</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{body}</p>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-brand-500' : 'w-1.5 bg-light-border dark:bg-dark-border'}`}
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
