import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Calendar, Sunrise, Target } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDailyDigest } from '../../services/digestService';

// Rules-based summary (see digest.service.js on the backend) — not an LLM
// call, so this loads instantly and costs nothing per view.
const DailyDigest = ({ onFocusTask }) => {
  const { bootstrapping, isAuthenticated } = useAuth();
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bootstrapping || !isAuthenticated) return;
    (async () => {
      try {
        const { data } = await getDailyDigest();
        setDigest(data.digest);
      } catch (e) {
        console.error('Failed to load daily digest', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [bootstrapping, isAuthenticated]);

  if (loading || !digest) return null;

  const allCaughtUp = digest.overdue.length === 0 && digest.dueToday.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-light-surface dark:bg-dark-raised rounded-xl border border-light-border dark:border-dark-border p-6 shadow-sm hover:shadow-lg transition-all duration-300"
    >
      <h3 className="text-lg font-semibold text-light-text dark:text-white mb-3 flex items-center gap-2">
        <Sunrise className="text-spark-500" />
        Today's focus
      </h3>
      <p className="text-sm text-light-text dark:text-dark-text mb-4">{digest.headline}</p>

      {digest.focusTask && (
        <button
          onClick={() => onFocusTask?.(digest.focusTask)}
          className="w-full text-left flex items-center gap-3 p-3 rounded-lg border border-spark-200 dark:border-spark-800 bg-spark-50 dark:bg-spark-900/20 hover:bg-spark-100 dark:hover:bg-spark-900/30 transition-colors mb-3"
        >
          <Target className="w-4 h-4 text-spark-600 dark:text-spark-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-spark-700 dark:text-spark-400 font-medium">Tackle this first</p>
            <p className="text-sm text-light-text dark:text-dark-text truncate">{digest.focusTask.title}</p>
          </div>
        </button>
      )}

      {!allCaughtUp && (
        <div className="space-y-2">
          {digest.overdue.slice(0, 3).map((t) => (
            <button
              key={t.id}
              onClick={() => onFocusTask?.(t)}
              className="w-full text-left flex items-center gap-2 text-sm text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 flex-shrink-0" />
              <span className="truncate">{t.title}</span>
            </button>
          ))}
          {digest.dueToday.slice(0, 3).map((t) => (
            <button
              key={t.id}
              onClick={() => onFocusTask?.(t)}
              className="w-full text-left flex items-center gap-2 text-sm text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text"
            >
              <Calendar className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
              <span className="truncate">{t.title}</span>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default DailyDigest;
