import React, { useEffect, useMemo, useState } from 'react';
import { Trash2, Search, FileStack } from 'lucide-react';
import { getTemplates, createPageFromTemplate, deleteTemplate } from '../services/templateService';

// Accent → thumbnail gradient + marker color (Tailwind classes).
const ACCENTS = {
  slate: { grad: 'from-slate-400/25 to-slate-500/5', dot: 'bg-slate-400' },
  violet: { grad: 'from-brand-400/30 to-brand-600/5', dot: 'bg-brand-400' },
  emerald: { grad: 'from-emerald-400/30 to-emerald-600/5', dot: 'bg-emerald-400' },
  blue: { grad: 'from-blue-400/30 to-blue-600/5', dot: 'bg-blue-400' },
  amber: { grad: 'from-spark-400/30 to-spark-600/5', dot: 'bg-spark-400' },
  rose: { grad: 'from-rose-400/30 to-rose-600/5', dot: 'bg-rose-400' },
};

// A miniature, abstract rendering of a template's block structure.
const BlockPreview = ({ preview = [], dot }) => (
  <div className="flex w-full flex-col gap-1.5">
    {preview.map((type, i) => {
      if (type === 'divider') return <div key={i} className="h-px w-full bg-black/10 dark:bg-white/10" />;
      const isHeading = type?.startsWith('heading');
      const barW = type === 'heading1' ? 'w-2/3' : type === 'heading2' ? 'w-1/2' : isHeading ? 'w-2/5' : 'w-full';
      const barH = isHeading ? 'h-2' : 'h-1.5';
      const barShade = isHeading ? 'bg-black/35 dark:bg-white/45' : 'bg-black/15 dark:bg-white/20';
      return (
        <div key={i} className="flex items-center gap-1.5">
          {type === 'todo' && <span className="h-2.5 w-2.5 shrink-0 rounded-[3px] border border-black/25 dark:border-white/30" />}
          {(type === 'bulleted' || type === 'numbered') && (
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
          )}
          {type === 'quote' && <span className="h-3 w-0.5 shrink-0 rounded bg-black/25 dark:bg-white/30" />}
          {type === 'callout' && <span className="h-2.5 w-2.5 shrink-0 rounded bg-spark-400/70" />}
          <span className={`${barW} ${barH} rounded ${barShade}`} />
        </div>
      );
    })}
  </div>
);

const Card = ({ tpl, onUse, onDelete, busy }) => {
  const accent = ACCENTS[tpl.accent] || ACCENTS.violet;
  return (
    <button
      onClick={() => onUse(tpl)}
      disabled={busy}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-[#2A2733] bg-white dark:bg-[#17151D] text-left transition-all duration-300 hover:-translate-y-1 hover:border-brand-400 hover:shadow-brand disabled:opacity-60"
    >
      {/* Thumbnail */}
      <div className={`relative h-28 w-full bg-gradient-to-br ${accent.grad} p-4`}>
        <div className="absolute right-3 top-3 text-2xl drop-shadow-sm">{tpl.icon}</div>
        <div className="h-full w-3/4 overflow-hidden">
          <BlockPreview preview={tpl.preview} dot={accent.dot} />
        </div>
        {/* hover CTA */}
        <div className="absolute inset-0 flex items-center justify-center bg-brand-600/0 opacity-0 transition-all duration-300 group-hover:bg-brand-600/85 group-hover:opacity-100">
          <span className="rounded-lg bg-white/95 px-3 py-1.5 text-sm font-semibold text-brand-700">
            {busy ? 'Creating…' : 'Use template'}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-display font-semibold text-gray-900 dark:text-white">{tpl.name}</h4>
          {!tpl.builtIn && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(tpl);
              }}
              className="text-gray-400 hover:text-red-500"
              title="Delete template"
            >
              <Trash2 size={15} />
            </span>
          )}
        </div>
        <p className="mt-1 line-clamp-2 flex-1 text-sm text-gray-500 dark:text-gray-400">
          {tpl.description}
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
          <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-600 dark:bg-white/5 dark:text-gray-300">
            {tpl.category}
          </span>
          <span>· {tpl.blockCount} blocks</span>
        </div>
      </div>
    </button>
  );
};

const CardSkeleton = () => (
  <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-[#2A2733]">
    <div className="h-28 w-full animate-pulse bg-gray-100 dark:bg-white/5" />
    <div className="space-y-2 p-4">
      <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100 dark:bg-white/5" />
      <div className="h-3 w-full animate-pulse rounded bg-gray-100 dark:bg-white/5" />
    </div>
  </div>
);

const TemplateGallery = ({ onUse }) => {
  const [data, setData] = useState({ builtIn: [], custom: [] });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('All');

  const load = async () => {
    setLoading(true);
    try {
      const { data: res } = await getTemplates();
      setData({ builtIn: res.builtIn || [], custom: res.custom || [] });
    } catch (e) {
      console.error('Failed to load templates', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleUse = async (tpl) => {
    setBusyId(tpl.id);
    try {
      const { data: res } = await createPageFromTemplate(tpl.id);
      onUse?.(res.page);
    } catch (e) {
      console.error('Failed to use template', e);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (tpl) => {
    if (!window.confirm(`Delete template "${tpl.name}"?`)) return;
    await deleteTemplate(tpl.id).catch((e) => console.error(e));
    load();
  };

  const all = useMemo(() => [...data.builtIn, ...data.custom], [data]);
  const categories = useMemo(
    () => ['All', ...Array.from(new Set(all.map((t) => t.category)))],
    [all]
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((t) => {
      const matchCat = cat === 'All' || t.category === cat;
      const matchQ = !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [all, cat, query]);

  return (
    <div>
      {/* Controls */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates…"
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-[#2A2733] dark:bg-[#17151D] dark:text-white"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                cat === c
                  ? 'bg-brand-gradient text-white shadow-brand-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 dark:border-[#2A2733] py-16 text-center">
          <FileStack className="mb-3 text-gray-300 dark:text-gray-600" size={40} />
          <p className="font-medium text-gray-700 dark:text-gray-200">No templates found</p>
          <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
            Try a different search or category — or open any page and choose “Save as template”.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tpl) => (
            <Card
              key={tpl.id}
              tpl={tpl}
              onUse={handleUse}
              onDelete={handleDelete}
              busy={busyId === tpl.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplateGallery;
