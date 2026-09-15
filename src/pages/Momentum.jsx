import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  AlertTriangle, CheckCircle2, Clock, Lock, ListTodo, TrendingDown, TrendingUp, Zap,
} from 'lucide-react';
import ChartTooltip from '../components/charts/ChartTooltip';
import { getMomentum } from '../services/momentumService';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { CHART_PRIMARY, SPARK, chartAxisColor } from '../utils/chartColors';
import { fadeUp, staggerDelay } from '../utils/motion';
import { logger } from '../utils/logger';

// Keep in sync with PRO_ONLY_PERIODS in motive-backend/src/services/momentum.service.js
// — the backend is the real gate (it downgrades the request and returns
// `periodLocked` regardless of what the client thinks), this list only
// drives the lock icon so a free user sees the Pro badge before clicking,
// not just after a request comes back restricted.
const PRO_ONLY_PERIODS = ['month', 'quarter'];

const PERIODS = [
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'quarter', label: 'This quarter' },
];

const SEVERITY_STYLES = {
  warning: { icon: AlertTriangle, className: 'text-spark-600 dark:text-spark-400' },
  good: { icon: CheckCircle2, className: 'text-emerald-600 dark:text-emerald-400' },
  info: { icon: TrendingUp, className: 'text-brand-600 dark:text-brand-400' },
};

// A tile's delta as an up/down/flat badge. `null` means "no prior-period
// baseline to compare against" (e.g. a metric that was 0 last period) —
// shown as "new", not as a fabricated 0% or a hidden number.
function DeltaBadge({ current, previous }) {
  if (previous == null) return null;
  if (previous === 0) {
    return current === 0 ? null : (
      <span className="text-xs font-medium text-light-muted dark:text-dark-muted">new</span>
    );
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return <span className="text-xs font-medium text-light-muted dark:text-dark-muted">flat</span>;
  const isUp = pct > 0;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${isUp ? 'text-spark-600 dark:text-spark-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
      {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(pct)}%
    </span>
  );
}

// Maps a tile/insight's meaning to the Dashboard's `?highlight=` contract
// (see Dashboard.jsx#matchesHighlight) — the other half of "click-through to
// the filtered list" (PLAN §3, Row 1 and Row 4).
function toHighlight(filter) {
  if (!filter) return null;
  if (filter.status) return filter.status; // 'overdue' | 'at-risk'
  if (filter.category) return `category:${filter.category}`;
  return null;
}

// A single clickable bar in the "By category" / "By status" breakdowns —
// pulled out since both render the exact same row shape.
function BarRow({ label, value, max, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-1 py-0.5 text-left transition hover:bg-light-border/30 dark:hover:bg-white/5"
    >
      <span className="w-24 shrink-0 truncate text-sm text-light-text dark:text-dark-text">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-light-border/50 dark:bg-dark-border/50">
        <div className="h-full rounded-full bg-brand-500" style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <span className="w-6 shrink-0 text-right text-sm text-light-muted dark:text-dark-muted">{value}</span>
    </button>
  );
}

// Builds the click-through URL for a highlight, optionally scoped to
// completedAt >= since (the "Shipped" tile's case — see Momentum's `since`
// prop below and Dashboard.jsx#matchesHighlight).
function highlightUrl(highlight, since) {
  const params = new URLSearchParams({ highlight });
  if (since) params.set('since', since);
  return `/dashboard?${params.toString()}`;
}

function Tile({ icon: Icon, label, value, context, delta, index, highlight, since, navigate }) {
  const clickable = highlight != null;
  const go = () => navigate(highlightUrl(highlight, since));
  return (
    <motion.div
      {...fadeUp}
      transition={staggerDelay(index)}
      onClick={clickable ? go : undefined}
      className={`panel panel-bd text-left ${clickable ? 'cursor-pointer transition hover:border-brand-500' : ''}`}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter') go(); } : undefined}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
          <Icon className="h-4 w-4" />
        </div>
        {delta}
      </div>
      <p className="text-2xl font-bold leading-none text-light-text dark:text-dark-text">{value}</p>
      <p className="mt-2 text-label text-light-muted dark:text-dark-muted">{label}</p>
      {context && <p className="mt-1 text-caption text-light-muted/80 dark:text-dark-muted/80">{context}</p>}
    </motion.div>
  );
}

const Momentum = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const isPro = !!user?.isPro;
  const navigate = useNavigate();
  const [period, setPeriod] = useState('week');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    getMomentum(period)
      .then((res) => { if (active) setData(res.data); })
      .catch((err) => {
        logger.warn('Failed to fetch momentum', { period, error: err.message });
        if (active) setError(true);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [period]);

  const peakIndex = data
    ? data.throughput.reduce((best, entry, i) => (entry.current > (data.throughput[best]?.current ?? -1) ? i : best), 0)
    : -1;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center"
      >
        <div>
          <h2 className="mb-1 flex items-center gap-3 font-display text-display font-semibold text-light-text dark:text-dark-text">
            <Zap className="text-spark-500" /> Momentum
          </h2>
          <p className="text-body text-light-muted dark:text-dark-muted">Where things stand, and what to do about it — not just counts.</p>
        </div>
        <div className="flex gap-2">
          {PERIODS.map((p) => {
            const locked = !isPro && PRO_ONLY_PERIODS.includes(p.id);
            // Highlight whichever tab matches what's *actually* shown
            // (`data.period`, server-confirmed) rather than merely requested
            // — otherwise clicking a locked tab would highlight "This
            // month" while the banner below says "showing this week."
            // Falls back to the requested `period` while that first
            // response is still in flight.
            const isActive = (data?.period ?? period) === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'border border-light-border bg-light-surface text-light-muted hover:border-brand-500 dark:border-dark-border dark:bg-dark-raised dark:text-dark-muted'
                }`}
              >
                {p.label}
                {/* Backend is the real gate — this badge is just so a free
                    user sees "Pro" before clicking, not only after the
                    response comes back downgraded (see periodLocked below). */}
                {locked && <Lock className="h-3 w-3 opacity-70" />}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* The server downgraded this request to 'week' (see momentum.controller.js)
          because the requested period is Pro-only — covers both a direct
          click on a locked button and a stale ?period=month bookmark from
          before a downgrade, neither of which should silently look broken. */}
      {!loading && data?.periodLocked && (
        <div className="panel panel-bd flex flex-wrap items-center gap-2 border-brand-200 bg-brand-50/60 text-sm dark:border-brand-800/60 dark:bg-brand-900/10">
          <Lock className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
          <span className="text-light-text dark:text-dark-text">Month and quarter views are part of Motive Pro — showing this week instead.</span>
          <Link to="/settings" className="ml-auto shrink-0 font-medium text-brand-600 hover:underline dark:text-brand-400">
            Upgrade →
          </Link>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-brand-600" />
        </div>
      ) : error || !data ? (
        <div className="panel panel-bd text-center text-sm text-light-muted dark:text-dark-muted">
          Couldn't load Momentum right now — try again in a moment.
        </div>
      ) : (
        <>
          {/* Row 1 — four signal tiles, each with a period-over-period
              delta instead of a bare, undated count (see PLAN §3). */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* "Shipped" is period-scoped (this week/month/quarter), so its
                click-through carries `since` — the server's own period
                boundary — rather than showing all-time done tasks. */}
            <Tile
              index={0}
              icon={CheckCircle2}
              label="Shipped"
              value={data.tiles.shipped.value}
              since={data.periodStart}
              delta={<DeltaBadge current={data.tiles.shipped.value} previous={data.tiles.shipped.previous} />}
              highlight="done"
              navigate={navigate}
            />
            <Tile
              index={1}
              icon={ListTodo}
              label="In flight"
              value={data.tiles.inFlight.value}
              context={data.tiles.inFlight.oldestDays != null ? `oldest: ${data.tiles.inFlight.oldestDays}d` : null}
              highlight="in-progress"
              navigate={navigate}
            />
            <Tile
              index={2}
              icon={AlertTriangle}
              label="At risk"
              value={data.tiles.atRisk.value}
              context="due within 48h"
              delta={<DeltaBadge current={data.tiles.atRisk.value} previous={data.tiles.atRisk.previous} />}
              highlight="at-risk"
              navigate={navigate}
            />
            <Tile
              index={3}
              icon={Clock}
              label="Overdue"
              value={data.tiles.overdue.value}
              delta={<DeltaBadge current={data.tiles.overdue.value} previous={data.tiles.overdue.previous} />}
              highlight="overdue"
              navigate={navigate}
            />
          </div>

          {/* Row 2 — one chart (this period's bars solid, last period's
              ghosted behind them so the comparison lives in the chart, not
              in the reader's head) + two honest stats: median (not mean)
              cycle time, and on-time rate. */}
          <motion.div {...fadeUp} transition={staggerDelay(4)} className="panel">
            <div className="panel-hd">
              <h3 className="flex items-center gap-2 text-title font-semibold text-light-text dark:text-dark-text">
                <TrendingUp className="h-4 w-4 text-brand-500" /> Throughput
              </h3>
              <div className="flex items-center gap-4 text-sm text-light-muted dark:text-dark-muted">
                {data.cycleTimeDays != null && (
                  <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {data.cycleTimeDays.toFixed(1)}d median cycle time</span>
                )}
                {data.onTimeRate != null && (
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> {data.onTimeRate}% on time</span>
                )}
              </div>
            </div>
            <div className="panel-bd">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.throughput} barGap={-16}>
                  <XAxis dataKey="name" stroke={chartAxisColor(isDark)} tick={{ fill: chartAxisColor(isDark) }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'transparent' }} />
                  {/* Previous period, ghosted behind this period's bars. */}
                  <Bar dataKey="previous" name="Previous" fill={isDark ? '#2A2733' : '#E7E0D4'} radius={[6, 6, 0, 0]} />
                  <Bar dataKey="current" name="This period" radius={[6, 6, 0, 0]}>
                    {data.throughput.map((entry, i) => (
                      <Cell key={i} fill={i === peakIndex ? SPARK[500] : CHART_PRIMARY} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Row 3 — where open work sits, by category and by status (see
              PLAN §3, "Where work piles up"). Per-assignee breakdown arrives
              once tasks carry a workspace/assignee (Phase 2). */}
          {(data.byCategory.length > 0 || data.byStatus.length > 0) && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {data.byCategory.length > 0 && (
                <motion.div {...fadeUp} transition={staggerDelay(5)} className="panel">
                  <div className="panel-hd">
                    <h3 className="text-title font-semibold text-light-text dark:text-dark-text">By category</h3>
                  </div>
                  <div className="panel-bd space-y-2.5">
                    {data.byCategory.map((c) => (
                      <BarRow key={c.name} label={c.name} value={c.value} max={data.byCategory[0].value || 1} onClick={() => navigate(`/dashboard?highlight=${encodeURIComponent(`category:${c.name}`)}`)} />
                    ))}
                  </div>
                </motion.div>
              )}
              {data.byStatus.length > 0 && (
                <motion.div {...fadeUp} transition={staggerDelay(5.5)} className="panel">
                  <div className="panel-hd">
                    <h3 className="text-title font-semibold text-light-text dark:text-dark-text">By status</h3>
                  </div>
                  <div className="panel-bd space-y-2.5">
                    {data.byStatus.map((s) => (
                      <BarRow key={s.status} label={s.name} value={s.value} max={data.byStatus[0].value || 1} onClick={() => navigate(`/dashboard?highlight=${encodeURIComponent(s.status === 'in_progress' ? 'in-progress' : s.status)}`)} />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Row 4 — rules-based "what to do about it", not a score. Positive
              states render too, deliberately (see momentum.service.js). */}
          <motion.div {...fadeUp} transition={staggerDelay(6)} className="panel panel-bd space-y-3">
            {data.insights.map((insight, i) => {
              const { icon: Icon, className } = SEVERITY_STYLES[insight.severity] || SEVERITY_STYLES.info;
              const highlight = toHighlight(insight.filter);
              const Wrapper = highlight ? 'button' : 'div';
              return (
                <Wrapper
                  key={i}
                  {...(highlight ? { onClick: () => navigate(`/dashboard?highlight=${encodeURIComponent(highlight)}`) } : {})}
                  className={`flex w-full items-start gap-2.5 rounded-lg text-left text-sm ${highlight ? '-mx-1 px-1 py-0.5 transition hover:bg-light-border/30 dark:hover:bg-white/5' : ''}`}
                >
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${className}`} />
                  <span className="text-light-text dark:text-dark-text">{insight.text}</span>
                </Wrapper>
              );
            })}
          </motion.div>
        </>
      )}
    </div>
  );
};

export default Momentum;
