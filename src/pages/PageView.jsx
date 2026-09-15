import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Star, Plus, LayoutTemplate, Check } from 'lucide-react';
import BlockEditor from '../components/editor/BlockEditor';
import { getPage } from '../services/pageService';
import { saveTemplate } from '../services/templateService';
import { useWorkspace } from '../context/WorkspaceContext';
import { usePageSocket } from '../hooks/usePageSocket';
import { logger } from '../utils/logger';

const PageView = () => {
  const { id } = useParams();
  const { editPage, addPage } = useWorkspace();
  const [page, setPage] = useState(null);
  const [savedTpl, setSavedTpl] = useState(false);
  const titleRef = useRef(null);
  const saveTimer = useRef(null);
  const contentRef = useRef(null);
  const { peers, sendCursor } = usePageSocket(id, contentRef);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await getPage(id);
      if (mounted) setPage(data.page);
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (page && titleRef.current && titleRef.current.textContent !== page.title) {
      titleRef.current.textContent = page.title === 'Untitled' ? '' : page.title;
    }
  }, [page?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTitleInput = (e) => {
    const title = e.currentTarget.textContent || 'Untitled';
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      editPage(id, { title: title.trim() || 'Untitled' });
    }, 500);
  };

  const toggleFavorite = () => {
    editPage(id, { favorite: !page.favorite }).then((p) => setPage(p));
  };

  const addSubPage = async () => {
    await addPage({ parentId: id, title: 'Untitled' });
  };

  const saveAsTemplate = async () => {
    const name = window.prompt('Name this template:', page.title || 'My template');
    if (!name) return;
    try {
      await saveTemplate({ pageId: id, name, icon: page.icon });
      setSavedTpl(true);
      setTimeout(() => setSavedTpl(false), 2500);
    } catch (e) {
      logger.warn('Failed to save template', { pageId: id, error: e.message });
    }
  };

  if (!page) {
    return <div className="p-10 text-light-muted dark:text-dark-muted">Loading…</div>;
  }

  return (
      <div
        ref={contentRef}
        onMouseMove={(e) => sendCursor(e.clientX, e.clientY)}
        className="relative mx-auto max-w-3xl rounded-2xl border border-light-border bg-light-surface px-8 py-10 dark:border-dark-border dark:bg-dark-raised"
      >
        {/* Other viewers' live cursors — position is a 0-1 fraction of this container. */}
        {peers.map((p) =>
          p.x == null ? null : (
            <div
              key={p.socketId}
              className="pointer-events-none absolute z-20 -translate-x-0.5 -translate-y-0.5 transition-[left,top] duration-100"
              style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
            >
              <div className="h-3 w-3 rotate-12 rounded-sm" style={{ backgroundColor: p.color }} />
              <span
                className="ml-2 whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: p.color }}
              >
                {p.user.name}
              </span>
            </div>
          )
        )}

        {peers.length > 0 && (
          <div className="absolute right-6 top-4 z-20 flex -space-x-2">
            {peers.map((p) => (
              <div
                key={p.socketId}
                title={p.user.name}
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-light-surface text-xs font-bold text-white dark:border-dark-raised"
                style={{ backgroundColor: p.color }}
              >
                {p.user.name?.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        )}

        <div className="mb-4 flex items-center gap-3 text-sm text-light-muted dark:text-dark-muted">
          <span className="text-3xl">{page.icon || '📄'}</span>
          <button
            onClick={toggleFavorite}
            className={`flex items-center gap-1 hover:text-spark-500 ${
              page.favorite ? 'text-spark-500' : ''
            }`}
            title="Toggle favorite"
          >
            <Star size={16} fill={page.favorite ? 'currentColor' : 'none'} />
          </button>
          <button onClick={addSubPage} className="flex items-center gap-1 hover:text-brand-500">
            <Plus size={16} /> Sub-page
          </button>
          <button
            onClick={saveAsTemplate}
            className="flex items-center gap-1 hover:text-brand-500"
            title="Save this page as a reusable template"
          >
            {savedTpl ? <Check size={16} className="text-emerald-500" /> : <LayoutTemplate size={16} />}
            {savedTpl ? 'Saved!' : 'Save as template'}
          </button>
        </div>

        <h1
          ref={titleRef}
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Untitled"
          onInput={handleTitleInput}
          className="mb-6 text-4xl font-bold outline-none text-light-text dark:text-dark-text empty:before:content-[attr(data-placeholder)] empty:before:text-light-muted dark:empty:before:text-dark-muted"
        />

        <BlockEditor pageId={id} />
      </div>
  );
};

export default PageView;
